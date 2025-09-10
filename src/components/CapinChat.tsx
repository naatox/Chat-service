import { useState, useRef, useEffect } from "react";
import { ChatHeader } from "./ChatHeader";
import { ChatMessage, type Message } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { TypingIndicator } from "./TypingIndicator";
import { clearChat, saveMessages, loadMessages, saveSessionId, loadSessionId, type SerializableMessage } from "@/lib/chatStorage";
import { useAuth } from "@/contexts/AuthContext";
import { SuggestedQuestions } from "./SuggestedQuestions";

type AppRole = "tms" | "publico" | "alumno" | "relator";

interface CapinChatProps {
  userRole?: AppRole;
  apiEndpoint?: string;
  onError?: (error: string) => void;
  className?: string;
  onClose?: () => void;
  showWelcome?: boolean;
  sessionScope?: string;
}

export const CapinChat = ({
  apiEndpoint = "https://rag-service-qgkc.onrender.com/api/chat",
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

  const { user } = useAuth();
  const initialRole: AppRole = (user?.role as AppRole) ?? "publico";

  const [selectedRole, setSelectedRole] = useState<AppRole>(initialRole);
  const [rut, setRut] = useState<string>("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const callChatAPI = async (question: string): Promise<string> => {
    const shouldSendRut = (selectedRole === "alumno" || selectedRole === "relator") && rut.trim().length > 0;
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
    const data = await res.json();
    return data.answer as string;
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
  };

  const handleSendMessage = async (display: string, actual?: string) => {
    const visibleText = display?.trim();
    const promptToSend = (actual ?? display)?.trim();
    if (!visibleText) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: visibleText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const response = await callChatAPI(promptToSend);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
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

  return (
    <div className={`bg-background border shadow-chat rounded-xl overflow-hidden flex flex-col h-[600px] max-w-md w-full ${className}`}>
      <ChatHeader
        userRole={selectedRole}
        onClose={onClose}
        onClear={handleClearChat}
        onChangeRole={setSelectedRole}
        rut={rut}
        onChangeRut={setRut}
      />

      {/* Sugeridas solo para alumno (resto queda "estándar" y sin preguntas rápidas) */}
      {selectedRole === "alumno" && (
        <SuggestedQuestions onAsk={handleSendMessage} role={selectedRole} />
      )}

      {/* Contenedor de mensajes SIN Radix ScrollArea para evitar el scrollbar fantasma */}
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
          <div ref={messagesEndRef} />
        </div>
      </div>

      <ChatInput onSendMessage={(text) => handleSendMessage(text)} disabled={isTyping} />
    </div>
  );
};
