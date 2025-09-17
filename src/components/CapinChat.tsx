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

type AppRole = "tms" | "publico" | "alumno" | "relator";

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
  const callChatAPI = async (question: string): Promise<ChatApiResponse> => {
    const shouldSendRut =
      (selectedRole === "alumno" || selectedRole === "relator") && rut.trim().length > 0;
    const claims = shouldSendRut ? { rut: rut.trim() } : undefined;

    const userPayload: unknown = {
      sub: "",
      role: selectedRole,
      session_id: sessionId,
      tenantId: "insecap",
      ...(claims ? { claims } : {}),
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
    const internal = `pagina ${n}`;
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
      />

      {/* Sugeridas para alumno y relator */}
      {(selectedRole === "alumno" || selectedRole === "relator") && (
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
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Hint bajo los listados (ADD-ONLY) */}
        {hasPagination && (
          <div className="px-4 py-3 text-xs text-muted-foreground border-t bg-background/80 backdrop-blur-sm">
            💡 <strong>Tip:</strong> Para ver detalles de un curso específico, escribe su código (ej.: R-REC-214).
          </div>
        )}
      </div>

      {hasPagination && (
        <div className="border-t bg-muted/50 px-3 py-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Página {page} / {totalPages} • Mostrando {showingCount} de {total}
          </span>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 rounded-md border hover:bg-muted disabled:opacity-40 transition-colors"
              onClick={() => goToPage(page - 1)}
              disabled={!canPrev || isTyping}
              aria-label="Página anterior"
            >
              ← Anterior
            </button>
            <button
              className="px-3 py-1 rounded-md border hover:bg-muted disabled:opacity-40 transition-colors"
              onClick={() => goToPage(page + 1)}
              disabled={!canNext || isTyping}
              aria-label="Página siguiente"
            >
              Siguiente →
            </button>
          </div>
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
