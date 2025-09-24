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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"; 

type AppRole = "tms" | "publico" | "alumno" | "relator" | "cliente";

interface ChatApiMeta {
  total_cursos?: number;
  page?: number;
  page_size?: number;
  returned?: number;
  citations?: Array<{ id?: string; title?: string | null; url?: string | null }>;
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

export const CapinChat = ({
  apiEndpoint = import.meta.env.VITE_API_ENDPOINT ?? "https://rag-service-qgkc.onrender.com/api/chat",
  onError,
  className = "",
  onClose,
  showWelcome = true,
  sessionScope = "guest",
}: CapinChatProps) => {
  const [sessionId] = useState(() => {
    const existing = loadSessionId(sessionScope);
    if (existing) return existing;
    const generated = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    saveSessionId(sessionScope, generated);
    return generated;
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const [lastMeta, setLastMeta] = useState<ChatApiMeta | null>(null);
  const [lastQuery, setLastQuery] = useState<string>("");

  const { user } = useAuth();
  const initialRole: AppRole = (user?.role as AppRole) ?? "publico";

  const [selectedRole, setSelectedRole] = useState<AppRole>(initialRole);
  const [rut, setRut] = useState<string>("");
  const [idCliente, setIdCliente] = useState<string>("");
  const [correo, setCorreo] = useState<string>("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null); // ADD
  const isMobile = useIsMobile(); // ADD

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

    const userPayload: unknown = {
      sub: "",
      role: selectedRole,
      session_id: sessionId,
      tenantId: "insecap",
      ...(claims ? { claims } : {}),
      ...(filters ? { filters } : {}),
    };

    const res = await fetch(apiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: question,
        role: selectedRole,
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

  const handleSendMessage = async (display: string, actual?: string) => {
    const visibleText = display?.trim();
    const promptToSend = (actual ?? display)?.trim();
    if (!visibleText) return;

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
      console.log("API response:", data);

      setLastMeta(data.meta ?? null);

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
        onChangeRole={setSelectedRole}
        rut={rut}
        onChangeRut={setRut}
        idCliente={idCliente}
        onChangeIdCliente={setIdCliente}
        correo={correo}
        onChangeCorreo={setCorreo}
      />

      {/* Sugeridas para alumno, relator y cliente */}
      {(selectedRole === "alumno" || selectedRole === "relator" || selectedRole === "cliente") && (
        <SuggestedQuestions onAsk={handleSendMessage} role={selectedRole} isMobile={isMobile} />
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
            <ChatMessage key={message.id} message={message} />
          ))}
          {isTyping && <TypingIndicator />}
          
          {/* Chips de desambiguación después del último mensaje del asistente (ADD-ONLY) */}
          {!isTyping && lastAssistantMessage && renderDisambiguationChips(lastMeta?.citations)}
          
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

      <ChatInput 
        onSendMessage={(text) => handleSendMessage(text)} 
        disabled={isTyping} 
        inputRef={inputRef}
      />
    </div>
  );
};
