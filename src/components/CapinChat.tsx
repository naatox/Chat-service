// src/components/CapinChat.tsx
import { useState, useRef, useEffect, useMemo } from "react";
import { ChatHeader } from "./ChatHeader";
import { ChatMessage, type Message } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { TypingIndicator } from "./TypingIndicator";
import {
  clearChat,
  saveMessages,
  loadMessages,
  saveSessionId,
  loadSessionId,
  type SerializableMessage,
} from "@/lib/chatStorage";
import { useAuth } from "@/contexts/AuthContext";
import { SuggestedQuestions } from "./SuggestedQuestions";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSessionId } from "@/hooks/useSessionId";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import { TmsQuickActions, type TmsActionType } from "./TmsQuickActions";
import { CourseCodeModal } from "./CourseCodeModal";
import { generateTmsPrompt } from "@/lib/tmsPrompts";
// ADD: Imports para modo libre
import { ChipModo } from "./ChipModo";
import { DrawerTrace } from "./DrawerTrace";
import { DebugBanner } from "./DebugBanner";
import { useConversationMode, useComparisonHints } from "@/hooks/useConversationMode";
import { buildGuidedPayload, buildFreePayload } from "@/lib/payloadBuilder";
import { sendChatTelemetry } from "@/lib/telemetry";
import { type ExtendedChatApiResponse, type LastPayloadState } from "@/lib/responseTypes";

type AppRole = "tms" | "publico" | "alumno" | "relator" | "cliente";

interface ChatApiMeta {
  total_cursos?: number;
  page?: number;
  page_size?: number;
  returned?: number;
  citations?: Array<{ id?: string; title?: string | null; url?: string | null }>;
  // ADD: Información de trazabilidad para modo libre
  trace?: {
    candidates?: Array<{ id?: string; title?: string; score?: number; source?: string }>;
    tools_called?: string[];
    search_strategy?: string;
    mode?: "guided" | "free";
    disabled_by_flag?: boolean;
  };
  [k: string]: unknown;
}

interface ChatApiResponse {
  answer: string;
  citations?: Array<{ id?: string; title?: string | null; url?: string | null }>;
  usage?: Record<string, unknown>;
  latency_ms?: number | null;
  session_id?: string | null;
  meta?: ChatApiMeta | null;
}

interface CapinChatProps {
  userRole?: AppRole;
  apiEndpoint?: string;
  onError?: (error: string) => void;
  className?: string;
  onClose?: () => void;
  showWelcome?: boolean;
  sessionScope?: string;
}

// Telemetría opcional (ADD-ONLY)
const sendTelemetry = (event: string, data?: Record<string, unknown>) => {
  try {
    // Solo enviar si hay endpoint de telemetría disponible
    if (typeof window !== 'undefined' && window.fetch) {
      window.fetch("/api/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, timestamp: new Date().toISOString(), ...data }),
      }).catch(() => {
        // Silenciar errores de telemetría
      });
    }
  } catch {
    // Silenciar errores de telemetría
  }
};

// Helper function to generate demo relator data for testing
const generateDemoRelatorData = (target: { rut?: string; nombre?: string } | undefined) => {
  const searchTerm = target?.rut || target?.nombre || "búsqueda";
  
  if (target?.rut) {
    return `**Relator encontrado:**

**Nombre:** Juan Carlos Pérez Mendoza  
**RUT:** ${target.rut}  
**Especialidad:** Logística y Transporte  
**Estado:** Activo  
**Cursos dictados:** 15  
**Evaluación promedio:** 4.8/5.0

**Contacto:**
- Email: juan.perez@insecap.cl
- Teléfono: +56 9 8765 4321

**Últimos cursos:**
- Gestión de Cadena de Suministro (Dic 2024)
- Optimización de Rutas de Transporte (Nov 2024)
- Logística Internacional (Oct 2024)

*Esta es información de demostración para testing del frontend.*`;
  }
  
  if (target?.nombre) {
    return `**Relatores encontrados para "${target.nombre}":**

**1. María Elena González**  
**RUT:** 12.345.678-9  
**Especialidad:** Logística Portuaria  
**Cursos:** 23 | **Evaluación:** 4.9/5.0

**2. Carlos Alberto Fernández**  
**RUT:** 23.456.789-0  
**Especialidad:** Transporte Terrestre  
**Cursos:** 18 | **Evaluación:** 4.7/5.0

**3. Ana Sofía Martínez**  
**RUT:** 34.567.890-1  
**Especialidad:** Gestión de Inventarios  
**Cursos:** 31 | **Evaluación:** 4.8/5.0

*Resultados de demostración para testing del frontend.*`;
  }
  
  return `**Búsqueda de relatores**

No se encontraron resultados para "${searchTerm}".

**Sugerencias:**
- Verifica que el RUT esté en formato correcto (XX.XXX.XXX-X)
- Intenta con el nombre completo del relator
- Consulta con el área de coordinación académica

*Esta es información de demostración para testing del frontend.*`;
};

// Helper function to generate demo costos data for testing
const generateDemoCostosData = (target: { codigoComer?: string } | undefined) => {
  const codigo = target?.codigoComer || "CÓDIGO";
  
  return `INFORMACIÓN DE COSTOS - ${codigo}

=== COSTOS DIRECTOS ===
Honorarios Relator:         $850.000
Material Didáctico:         $125.000
Sala de Clases:            $180.000
Equipamiento Técnico:       $95.000
Certificaciones:           $45.000
                           ----------
Subtotal Directo:         $1.295.000

=== COSTOS INDIRECTOS ===
Administración (8%):       $103.600
Coordinación Académica:     $75.000
Soporte Técnico:           $35.000
Marketing:                 $50.000
                           ----------
Subtotal Indirecto:        $263.600

=== RESUMEN FINAL ===
Total Costos Directos:    $1.295.000
Total Costos Indirectos:    $263.600
                           ----------
COSTO TOTAL PROGRAMA:     $1.558.600

Margen Sugerido (25%):      $389.650
PRECIO VENTA SUGERIDO:    $1.948.250

=== NOTAS ===
- Precios actualizados: Octubre 2024
- Válido para grupos de 15-20 participantes
- No incluye traslados ni hospedaje
- Cotización válida por 30 días

*Esta es información de demostración para testing del frontend.*`;
};

export const CapinChat = ({
  apiEndpoint = import.meta.env.VITE_API_ENDPOINT ?? "http://localhost:8000/api/chat",
  onError,
  className = "",
  onClose,
  showWelcome = true,
  sessionScope = "guest",
}: CapinChatProps) => {
  // Hook para manejo de sesiones
  const { sessionId, resetSession } = useSessionId();
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isResettingSession, setIsResettingSession] = useState(false);

  const [lastMeta, setLastMeta] = useState<ChatApiMeta | null>(null);
  const [lastQuery, setLastQuery] = useState<string>("");
  
  // ADD: Estados para tracking de modo libre (NO afecta flujos existentes)
  const [lastPayload, setLastPayload] = useState<{ source?: string; intent?: string; timestamp?: number } | null>(null);
  
  // ADD: Estados para debugging de mode mismatch
  const [modeMismatch, setModeMismatch] = useState<{ expected: string; received: string; strategy?: string } | null>(null);

  // ADD: Estados para TMS Quick Actions
  const [isTmsModalOpen, setIsTmsModalOpen] = useState(false);
  const [selectedTmsAction, setSelectedTmsAction] = useState<TmsActionType | null>(null);

  const { user } = useAuth();
  const initialRole: AppRole = (user?.role as AppRole) ?? "publico";

  const [selectedRole, setSelectedRole] = useState<AppRole>(initialRole);
  
  // ADD: Computed - verificar si es rol TMS (incluye "tms" base y "tms:*" con subroles)
  const isTmsRole = selectedRole === 'tms' || selectedRole.startsWith('tms:');
  const [rut, setRut] = useState<string>("");
  const [idCliente, setIdCliente] = useState<string>("");
  const [correo, setCorreo] = useState<string>("");
  const [tmsSubrol, setTmsSubrol] = useState<string>("coordinador"); // ADD: Estado para subrol TMS

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null); // ADD
  const isMobile = useIsMobile(); // ADD
  
  // ADD: Hook para determinar modo actual
  const conversationMode = useConversationMode({
    lastSource: lastPayload?.source,
    lastIntent: lastPayload?.intent,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    const raw = loadMessages(sessionId);
    if (raw && Array.isArray(raw)) {
      const hydrated: Message[] = raw.map((m: SerializableMessage) => ({
        ...m,
        timestamp: new Date(m.timestamp),
        files: Array.isArray(m.files) ? (m.files as File[]) : undefined,
      }));
      setMessages(hydrated);
    } else {
      setMessages(
        showWelcome
          ? [
              {
                id: "welcome",
                text: "¡Hola! Soy Capin, tu asistente virtual de Insecap. ¿En qué puedo ayudarte hoy?",
                sender: "assistant",
                timestamp: new Date(),
              },
            ]
          : []
      );
    }
  }, [sessionId, showWelcome]);

  useEffect(() => {
    const serializable: SerializableMessage[] = messages.map((m) => ({
      id: m.id,
      text: m.text,
      sender: m.sender,
      timestamp: m.timestamp.toISOString(),
      files: m.files,
    }));
    saveMessages(sessionId, serializable.slice(-100));
  }, [messages, sessionId]);

  // --- Paginación derivada del meta ---
  const page = Number(lastMeta?.page ?? 0);
  const pageSize = Number(lastMeta?.page_size ?? 0);
  const total = Number(lastMeta?.total_cursos ?? 0);
  const totalPages = useMemo(() => {
    if (!pageSize || !total) return 0;
    return Math.max(1, Math.ceil(total / pageSize));
  }, [pageSize, total]);

  const hasPagination = totalPages > 1 && page > 0 && pageSize > 0;
  const canPrev = hasPagination && page > 1;
  const canNext = hasPagination && page < totalPages;

  useEffect(() => {
    if (inputRef.current && (canPrev || canNext)) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [page, canPrev, canNext]);

  const courseCodePattern = /^R-[A-Z]{3}-\d+$/i;
  const renderDisambiguationChips = (citations?: ChatApiResponse["citations"]) => {
    if (!citations || !Array.isArray(citations) || citations.length < 2) return null;
    
    return (
      <div className="flex flex-wrap gap-2 my-3 px-4" aria-label="Opciones de cursos similares">
        <div className="text-xs text-muted-foreground mb-1 w-full">Cursos relacionados:</div>
        {citations.map((c, idx) =>
          c.id ? (
            <button
              key={`${c.id}-${idx}`}
              className="px-3 py-1.5 rounded-full bg-muted hover:bg-primary/10 border text-xs transition-colors duration-200 font-medium"
              onClick={() => handleSendMessage(c.id!)}
              aria-label={`Consultar curso ${c.id}`}
              type="button"
            >
              {c.id}
              {c.title && (
                <span className="ml-1 text-muted-foreground">• {c.title.slice(0, 20)}...</span>
              )}
            </button>
          ) : null
        )}
      </div>
    );
  };

  // === API ===
  const callChatAPI = async (question: string, pageOverride?: number): Promise<ChatApiResponse> => {
    const shouldSendRut =
      (selectedRole === "alumno" || selectedRole === "relator") && rut.trim().length > 0;
    
    const shouldSendClienteClaims =
      selectedRole === "cliente" && 
      rut.trim().length > 0 && 
      idCliente.trim().length > 0 && 
      correo.trim().length > 0;

    let claims: Record<string, string> | undefined;
    
    if (shouldSendRut) {
      claims = { rut: rut.trim() };
    } else if (shouldSendClienteClaims) {
      claims = { 
        rut: rut.trim(), 
        idCliente: idCliente.trim(), 
        correo: correo.trim() 
      };
    }

    // ADD: Filtros de paginación para cliente
    let filters: Record<string, number> | undefined;
    if (selectedRole === "cliente") {
      const currentPage = pageOverride || page || 1;
      const currentPageSize = pageSize || 10;
      filters = {
        page: currentPage,
        page_size: currentPageSize
      };
    }

    // ADD: Determinar el rol final a enviar al backend
    const finalRole = selectedRole === "tms" ? `tms:${tmsSubrol}` : selectedRole;

    const userPayload: unknown = {
      sub: "",
      role: finalRole, // MODIFICADO: Usar finalRole que incluye formato "tms:subrol"
      session_id: sessionId,
      tenantId: "insecap",
      ...(claims ? { claims } : {}),
      ...(filters ? { filters } : {}),
    };

    // Log para debugging del RAG backend


    // ADD: Verificación explícita de payload para debugging
    const payloadSource = lastPayload?.source || "chat_input";
    const payloadIntent = lastPayload?.intent;
    const modeCandidate = payloadIntent ? "guided" : "free";
    
    // ADD: Log explícito para verificación front↔backend
    console.info(`[PAYLOAD VERIFICATION] modeCandidate: ${modeCandidate}, source: ${payloadSource}, intent: ${payloadIntent || 'undefined'}, role: ${finalRole}, session_id: ${sessionId}`);

    const res = await fetch(apiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: question,
        role: finalRole, // Enviar el rol correcto (con subroles tms:*)
        session_id: sessionId, // Incluir session_id en el payload principal
        // ADD: Incluir source para enrutamiento backend (SIEMPRE)
        source: payloadSource,
        // ADD: Incluir intent solo si existe (modo guided)
        ...(payloadIntent ? { intent: payloadIntent } : {}),
        user: userPayload,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status} - ${text}`);
    }
    const data = (await res.json()) as ChatApiResponse;
    
    return data;
  };

  const handleClearChat = () => {
    const ok = confirm("¿Borrar toda la conversación?");
    if (!ok) return;
    if (sessionId) clearChat(sessionId);
    setMessages([
      {
        id: "welcome",
        text: "¡Hola! Soy Capin, tu asistente virtual. ¿En qué puedo ayudarte hoy?",
        sender: "assistant",
        timestamp: new Date(),
      },
    ]);
    setLastMeta(null);
    setLastQuery("");
  };

  // ADD: Función para cambiar sesión
  const handleResetSession = async () => {
    setIsResettingSession(true);
    
    try {
      // Generar nuevo session_id
      const newSessionId = resetSession();
      
      // Limpiar historial visual (pero NO el backend)
      setMessages([
        {
          id: "welcome",
          text: "¡Hola! Soy Capin, tu asistente virtual. ¿En qué puedo ayudarte hoy?",
          sender: "assistant",
          timestamp: new Date(),
        },
      ]);
      setLastMeta(null);
      setLastQuery("");
      
      // Mostrar toast informativo
      toast({
        title: "Sesión cambiada",
        description: `Nueva sesión: ${newSessionId.slice(0, 8)}... Los próximos 8 mensajes usarán contexto limpio.`,
        duration: 3000,
      });
      

      
    } catch (error) {
      console.error("Error al cambiar sesión:", error);
      toast({
        title: "Error",
        description: "No se pudo cambiar la sesión. Intenta de nuevo.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      // Deshabilitar input por 200ms para evitar dobles envíos
      setTimeout(() => {
        setIsResettingSession(false);
      }, 200);
    }
  };

  // ADD: Handlers para TMS Quick Actions
  const handleTmsActionClick = (action: TmsActionType) => {
    setSelectedTmsAction(action);
    setIsTmsModalOpen(true);
  };

  const handleTmsConfirm = async (codigoCurso: string, tipo: TmsActionType) => {
    // MANTENER EXACTO: Generar prompt usando función existente
    const explicitPrompt = generateTmsPrompt(codigoCurso, tipo);
    
    // ADD: Tracking para modo guided (NO cambia el comportamiento)
    setLastPayload({
      source: "quick_action",
      intent: `tms.get_${tipo.toLowerCase()}`,
      timestamp: Date.now(),
    });
    
    // ADD: Telemetría no disruptiva
    sendChatTelemetry({
      mode: "guided",
      source: "quick_action",
      intent: `tms.get_${tipo.toLowerCase()}`,
      role: selectedRole,
      session_id: sessionId,
    });
    
    // Log para debugging

    
    // MANTENER EXACTO: Enviar el mensaje con el prompt explícito generado (sin cambios)
    await handleSendMessage(`Consultar ${tipo}: ${codigoCurso}`, explicitPrompt);
  };

  // ADD: Manejador para acciones adicionales (RelatorQuickAction)
  const handleAdditionalActionSend = async (payload: {
    source: string;
    intent: string;
    message: string;
    target?: { rut?: string; nombre?: string; codigoComer?: string };
  }) => {
    try {
      // Tracking para modo guided
      setLastPayload({
        source: payload.source,
        intent: payload.intent,
        timestamp: Date.now(),
      });

      // Telemetría
      sendChatTelemetry({
        mode: "guided",
        source: payload.source as "quick_action",
        intent: payload.intent,
        role: selectedRole,
        session_id: sessionId,
      });

      // Log para debugging


      // Construir mensaje descriptivo para el chat
      let displayMessage = payload.message;
      if (payload.intent === "tms.find_relator") {
        if (payload.target?.rut) {
          displayMessage = `Buscar relator con RUT: ${payload.target.rut}`;
        } else if (payload.target?.nombre) {
          displayMessage = `Buscar relator con nombre: ${payload.target.nombre}`;
        }
      } else if (payload.intent === "tms.get_costos") {
        if (payload.target?.codigoComer) {
          displayMessage = `Consultar costos para: ${payload.target.codigoComer}`;
        }
      }

      // Agregar mensaje del usuario al chat
      const userMessage: Message = {
        id: crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now()}`,
        text: displayMessage,
        sender: "user",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      setIsTyping(true);

      // Log para debugging - payload exacto
      console.info('[Additional Action payload]', payload);

      // Construir payload completo EXACTO según especificación
      const fullPayload = {
        message: payload.message,                      // Message específico del intent
        source: payload.source,                        // "quick_action"
        intent: payload.intent,                        // "tms.find_relator" o "tms.get_costos"
        role: selectedRole === "tms" ? `tms:${tmsSubrol}` : (selectedRole ?? "tms:logistica"),
        session_id: sessionId,
        target: payload.target,                        // obligatorio: rut/nombre o codigoComer
        user: {
          role: selectedRole === "tms" ? `tms:${tmsSubrol}` : (selectedRole ?? "tms:logistica"),
          session_id: sessionId,
          tenantId: "insecap",
          claims: {}
        }
      } as const;

      // Enviar directamente al API endpoint
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fullPayload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ExtendedChatApiResponse = await response.json();

      // Procesar respuesta igual que en callChatAPI
      const assistantMessage: Message = {
        id: crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now()}-assistant`,
        text: data.answer,
        sender: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setLastMeta(data.meta);

      // Log para debugging del modo


      // Banner de depuración para intent deshabilitado
      if (data.meta?.trace?.mode === "guided" && data.meta?.trace?.disabled_by_flag === true) {
        toast({
          title: "Intent deshabilitado",
          description: `Intent ${payload.intent} deshabilitado por el servidor`,
          variant: "default",
        });
      }

    } catch (error) {
      console.error("Error en acción adicional:", error);
      
      // Para errores 422 o 404, generar datos de demostración
      if (error instanceof Error && (error.message.includes('422') || error.message.includes('404'))) {

        
        let demoData: string;
        if (payload.intent === "tms.find_relator") {
          demoData = generateDemoRelatorData(payload.target);
        } else if (payload.intent === "tms.get_costos") {
          demoData = generateDemoCostosData(payload.target);
        } else {
          demoData = `Datos de demostración para intent: ${payload.intent}`;
        }
        
        const assistantMessage: Message = {
          id: crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now()}-demo`,
          text: demoData,
          sender: "assistant",
          timestamp: new Date(),
        };
        
        setMessages((prev) => [...prev, assistantMessage]);
        
        toast({
          title: "Modo Demo",
          description: "Mostrando datos de ejemplo (backend no disponible)",
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: "No se pudo procesar la acción. Inténtalo de nuevo.",
          variant: "destructive",
        });
      }
    } finally {
      setIsTyping(false);
    }
  };

  // ADD: Handler para selección de relator desde resultados clickeables
  const handleRelatorSelect = async (rut: string) => {

    
    // Crear payload para búsqueda por RUT
    const payload = {
      source: "relator_result_click",
      intent: "tms.find_relator",
      message: "Relator search",
      target: { rut }
    };
    
    // Tracking para modo guided
    setLastPayload({
      source: payload.source,
      intent: payload.intent,
      timestamp: Date.now(),
    });
    
    // Telemetría
    sendChatTelemetry({
      mode: "guided",
      source: payload.source as "quick_action",
      intent: payload.intent,
      role: selectedRole,
      session_id: sessionId,
    });
    
    // Enviar búsqueda automática
    await handleAdditionalActionSend(payload);
  };

  // ADD: Atajo de teclado Ctrl+K para R11
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k' && isTmsRole) {
        e.preventDefault();
        handleTmsActionClick('R11');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTmsRole]);

  const handleSendMessage = async (display: string, actual?: string) => {
    const visibleText = display?.trim();
    const promptToSend = (actual ?? display)?.trim();
    if (!visibleText) return;

    // ADD: Detectar si NO viene de Quick Action (modo libre)
    const isFromQuickAction = lastPayload?.source === "quick_action" && 
                             Date.now() - (lastPayload.timestamp || 0) < 1000; // 1 segundo de gracia
    
    if (!isFromQuickAction) {
      // ADD: Tracking para modo libre
      setLastPayload({
        source: "chat_input",
        intent: undefined,
        timestamp: Date.now(),
      });
      
      // ADD: Detectar hints de comparación (lógica inline)
      const compareKeywords = [
        "comparar", "versus", "vs", "mejor entre", "diferencia entre", 
        "cuál es mejor", "comparación", "diferencias", "similitudes"
      ];
      const lowerMessage = promptToSend.toLowerCase();
      const wants_compare = compareKeywords.some(keyword => 
        lowerMessage.includes(keyword)
      );
      const comparisonHints = { wants_compare };
      
      // ADD: Telemetría para modo libre
      sendChatTelemetry({
        mode: "free",
        source: "chat_input",
        role: selectedRole,
        session_id: sessionId,
        ...(comparisonHints.wants_compare ? { client_hints: comparisonHints } : {}),
      });
    }

    // Validar que los campos requeridos estén completos para el rol cliente
    if (selectedRole === "cliente") {
      if (!rut.trim() || !idCliente.trim() || !correo.trim()) {
        alert("Por favor completa todos los campos requeridos: RUT, ID Cliente y Email");
        return;
      }
      
      // ADD: Interceptar comandos de paginación para cliente
      const pageCommand = promptToSend.toLowerCase();
      
      // Detectar "página X", "siguiente", "anterior"
      const pageMatch = pageCommand.match(/^página?\s*(\d+)$/);
      if (pageMatch) {
        const targetPage = parseInt(pageMatch[1]);
        if (targetPage > 0 && hasPagination && targetPage <= totalPages) {
          sendTelemetry("page_nav", { 
            page: targetPage, 
            total_pages: totalPages,
            session_scope: sessionScope 
          });
          const display = `→ Página ${targetPage}`;
          const internal = lastQuery || "Muéstrame todos mis cursos activos y pasados como cliente";
          // Reenviar la última query con la nueva página
          setLastQuery(internal);
          
          const userMessage: Message = {
            id: Date.now().toString(),
            text: display,
            sender: "user",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, userMessage]);
          setIsTyping(true);
          
          try {
            const data = await callChatAPI(internal, targetPage);
            setLastMeta(data.meta ?? null);
            const assistantMessage: Message = {
              id: (Date.now() + 1).toString(),
              text: data.answer ?? "",
              sender: "assistant", 
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, assistantMessage]);
          } catch (error) {
            setMessages((prev) => [...prev, {
              id: (Date.now() + 1).toString(),
              text: "Lo siento, ocurrió un problema al contactar al servicio. Intenta nuevamente.",
              sender: "assistant",
              timestamp: new Date(),
            }]);
          } finally {
            setIsTyping(false);
          }
          return;
        }
      }
      
      if (pageCommand === "siguiente" && canNext) {
        sendTelemetry("page_nav", { 
          page: page + 1, 
          total_pages: totalPages,
          session_scope: sessionScope 
        });
        const display = `→ Página ${page + 1}`;
        const internal = lastQuery || "Muéstrame todos mis cursos activos y pasados como cliente";
        
        setLastQuery(internal);
        const userMessage: Message = {
          id: Date.now().toString(),
          text: display,
          sender: "user",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMessage]);
        setIsTyping(true);
        
        try {
          const data = await callChatAPI(internal, page + 1);
          setLastMeta(data.meta ?? null);
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: data.answer ?? "",
            sender: "assistant",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
          setMessages((prev) => [...prev, {
            id: (Date.now() + 1).toString(),
            text: "Lo siento, ocurrió un problema al contactar al servicio. Intenta nuevamente.",
            sender: "assistant",
            timestamp: new Date(),
          }]);
        } finally {
          setIsTyping(false);
        }
        return;
      }
      
      if (pageCommand === "anterior" && canPrev) {
        sendTelemetry("page_nav", { 
          page: page - 1, 
          total_pages: totalPages,
          session_scope: sessionScope 
        });
        const display = `→ Página ${page - 1}`;
        const internal = lastQuery || "Muéstrame todos mis cursos activos y pasados como cliente";
        
        setLastQuery(internal);
        const userMessage: Message = {
          id: Date.now().toString(),
          text: display,
          sender: "user",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMessage]);
        setIsTyping(true);
        
        try {
          const data = await callChatAPI(internal, page - 1);
          setLastMeta(data.meta ?? null);
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: data.answer ?? "",
            sender: "assistant",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
          setMessages((prev) => [...prev, {
            id: (Date.now() + 1).toString(),
            text: "Lo siento, ocurrió un problema al contactar al servicio. Intenta nuevamente.",
            sender: "assistant",
            timestamp: new Date(),
          }]);
        } finally {
          setIsTyping(false);
        }
        return;
      }
    }

    if (courseCodePattern.test(visibleText)) {
      sendTelemetry("course_code_query", { 
        pattern: "course_code",
        session_scope: sessionScope 
      });
    }

    setLastQuery(promptToSend);

    const userMessage: Message = {
      id: Date.now().toString(),
      text: visibleText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const data = await callChatAPI(promptToSend);


      setLastMeta(data.meta ?? null);
      
      // ADD: Detectar mode mismatch para UI debugging
      const expectedMode = lastPayload?.intent ? "guided" : "free";
      const responseMode = data.meta?.trace?.mode;
      if (responseMode && responseMode !== expectedMode) {
        setModeMismatch({
          expected: expectedMode,
          received: responseMode,
          strategy: data.meta?.trace?.search_strategy
        });
        // Auto-clear después de 10 segundos
        setTimeout(() => setModeMismatch(null), 10000);
      } else {
        setModeMismatch(null);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.answer ?? "",
        sender: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: "Lo siento, ocurrió un problema al contactar al servicio. Intenta nuevamente.",
          sender: "assistant",
          timestamp: new Date(),
        },
      ]);
      onError?.(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setIsTyping(false);
    }
  };

  const goToPage = (n: number) => {
    if (!n || n < 1 || (hasPagination && n > totalPages)) return;
    sendTelemetry("page_nav", { 
      page: n, 
      total_pages: totalPages,
      session_scope: sessionScope 
    });
    
    const display = `→ Página ${n}`;
    let internal;
    
    // Para cliente, reutilizar la última query manteniendo contexto
    // Para alumno/relator, usar comando de página directo
    if (selectedRole === "cliente") {
      internal = lastQuery || "Muéstrame todos mis cursos activos y pasados como cliente";
    } else {
      internal = `pagina ${n}`;
    }
    
    handleSendMessage(display, internal);
  };

  const showingCount = useMemo(() => {
    if (!hasPagination) return 0;
    const shown = Math.min(pageSize, total - (page - 1) * pageSize);
    return Math.max(0, shown);
  }, [hasPagination, page, pageSize, total]);

  const lastAssistantMessage = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender === "assistant") {
        return messages[i];
      }
    }
    return null;
  }, [messages]);

  return (
    <div
      className={`bg-background border shadow-chat rounded-xl overflow-hidden flex flex-col h-[600px] max-w-md w-full ${className}`}
    >
      <ChatHeader
        userRole={selectedRole}
        onClose={onClose}
        onClear={handleClearChat}
        onResetSession={handleResetSession} // ADD: Callback para cambiar sesión
        isResettingSession={isResettingSession} // ADD: Estado para deshabilitar controles
        onChangeRole={setSelectedRole}
        rut={rut}
        onChangeRut={setRut}
        idCliente={idCliente}
        onChangeIdCliente={setIdCliente}
        correo={correo}
        onChangeCorreo={setCorreo}
        tmsSubrol={tmsSubrol}
        onChangeTmsSubrol={setTmsSubrol}
      />

      {/* ADD: Acciones TMS - Solo para roles tms:* */}
      {isTmsRole && (
        <TmsQuickActions 
          onActionClick={handleTmsActionClick}
          onAdditionalActionSend={handleAdditionalActionSend}
          currentRole={selectedRole === "tms" ? `tms:${tmsSubrol}` : selectedRole}
          disabled={isTyping || isResettingSession}
          isMobile={isMobile}
        />
      )}

      {/* Sugeridas para alumno, relator y cliente */}
      {(selectedRole === "alumno" || selectedRole === "relator" || selectedRole === "cliente") && (
        <SuggestedQuestions 
          onAsk={handleSendMessage} 
          role={selectedRole} 
          isMobile={isMobile} 
          disabled={isTyping || isResettingSession}
        />
      )}

      {/* Contenedor de mensajes */}
      <div
        className="
          flex-1 overflow-y-auto overscroll-contain scroll-smooth
          px-0
          [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden
        "
      >
        <div className="space-y-0">
          {messages.map((message) => (
            <div key={message.id}>
              <ChatMessage 
                message={message} 
                onRelatorSelect={isTmsRole ? handleRelatorSelect : undefined}
              />
            </div>
          ))}
          {isTyping && <TypingIndicator />}
          
          {/* Chips de desambiguación después del último mensaje del asistente (ADD-ONLY) */}
          {!isTyping && lastAssistantMessage && renderDisambiguationChips(lastMeta?.citations)}
          
          {/* ADD: Chip de modo y drawer de trazabilidad (NO disruptivo) */}
          {!isTyping && lastAssistantMessage && (
            <div className="px-4 py-2 flex items-center justify-between">
              <ChipModo mode={conversationMode} />
              <DrawerTrace 
                candidates={lastMeta?.trace?.candidates}
                toolsCalled={lastMeta?.trace?.tools_called}
                disabled={isTyping}
              />
            </div>
          )}
          
          {/* Aviso de página para cliente después del último mensaje (ADD-ONLY) */}
          {!isTyping && lastAssistantMessage && selectedRole === "cliente" && hasPagination && (
            <div className="px-4 py-2 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200">
                📄 Página {page} de {totalPages}
                {total > 0 && (
                  <span className="text-blue-600">
                    • {showingCount} de {total} cursos
                  </span>
                )}
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Hint bajo los listados (ADD-ONLY) */}
        {hasPagination && (
          <div className="px-4 py-3 text-xs text-muted-foreground border-t bg-background/80 backdrop-blur-sm">
            💡 <strong>Tip:</strong> 
            {selectedRole === "cliente" 
              ? "Escribe 'página 2', 'siguiente' o 'anterior' para navegar entre páginas."
              : "Para ver detalles de un curso específico, escribe su código (ej.: R-REC-214)."
            }
          </div>
        )}
      </div>

      {hasPagination && (
        <div className="border-t bg-muted/50 px-3 py-2">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              Página {page} de {totalPages} • Mostrando {showingCount} de {total}
            </span>
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => goToPage(page - 1)}
                  className={!canPrev || isTyping ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {/* Mostrar números de página cuando hay pocas páginas */}
              {totalPages <= 5 && Array.from({length: totalPages}, (_, i) => i + 1).map((pageNum) => (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => goToPage(pageNum)}
                    isActive={pageNum === page}
                    className="cursor-pointer"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              {/* Para muchas páginas, mostrar página actual y adyacentes */}
              {totalPages > 5 && (
                <>
                  {page > 2 && (
                    <PaginationItem>
                      <PaginationLink onClick={() => goToPage(1)} className="cursor-pointer">
                        1
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  
                  {page > 3 && <span className="text-muted-foreground">...</span>}
                  
                  {page > 1 && (
                    <PaginationItem>
                      <PaginationLink onClick={() => goToPage(page - 1)} className="cursor-pointer">
                        {page - 1}
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  
                  <PaginationItem>
                    <PaginationLink isActive className="cursor-pointer">
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                  
                  {page < totalPages && (
                    <PaginationItem>
                      <PaginationLink onClick={() => goToPage(page + 1)} className="cursor-pointer">
                        {page + 1}
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  
                  {page < totalPages - 2 && <span className="text-muted-foreground">...</span>}
                  
                  {page < totalPages - 1 && (
                    <PaginationItem>
                      <PaginationLink onClick={() => goToPage(totalPages)} className="cursor-pointer">
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  )}
                </>
              )}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => goToPage(page + 1)}
                  className={!canNext || isTyping ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* ADD: Banner de debugging para mode mismatch */}
      <DebugBanner
        modeMismatch={modeMismatch}
        forcedGuidedMode={lastMeta?.trace?.mode === "guided" && lastMeta?.trace?.search_strategy === "forced_by_flag"}
      />

      <ChatInput 
        onSendMessage={(text) => handleSendMessage(text)} 
        disabled={isTyping || isResettingSession} 
        inputRef={inputRef}
      />

      {/* ADD: Modal para código de curso TMS */}
      <CourseCodeModal
        isOpen={isTmsModalOpen}
        onClose={() => {
          setIsTmsModalOpen(false);
          setSelectedTmsAction(null);
        }}
        onConfirm={handleTmsConfirm}
        actionType={selectedTmsAction}
      />
    </div>
  );
};
