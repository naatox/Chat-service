import { useState, useRef, useEffect } from "react";
import { ChatHeader } from "./ChatHeader";
import { ChatMessage, type Message } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { TypingIndicator } from "./TypingIndicator";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

// nuevo: helpers de storage
import {
  saveMessages,
  loadMessages,
  saveSessionId,
  loadSessionId,
  type SerializableMessage,
} from "@/lib/chatStorage";

interface CapinChatProps {
  userRole?: string;
  apiEndpoint?: string;
  onError?: (error: string) => void;
  className?: string;
  onClose?: () => void;
  showWelcome?: boolean;
  sessionScope?: string;
}

export const CapinChat = ({
  userRole = "",
  apiEndpoint = 'https://rag-service-qgkc.onrender.com/api/chat',
  onError,
  className = "",
  onClose,
  showWelcome = true,
  sessionScope = "guest",
}: CapinChatProps) => {

  // 1) sessionId persistente en localStorage por "scope"
  const [sessionId, setSessionId] = useState(() => {
    const existing = loadSessionId(sessionScope);
    if (existing) return existing;
    const generated = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    saveSessionId(sessionScope, generated);
    return generated;
  });

  // 2) estado de mensajes (se hidrata en useEffect)
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // 3) Hidratar mensajes de localStorage al montar (según sessionId)
  useEffect(() => {
    const raw = loadMessages(sessionId);
    if (raw && Array.isArray(raw)) {
      const hydrated: Message[] = raw.map((m: SerializableMessage) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      }));
      setMessages(hydrated);
    } else {
      if (showWelcome) {
        setMessages([{
          id: "welcome",
          text: "¡Hola! Soy Capin, tu asistente virtual de Insecap. ¿En qué puedo ayudarte hoy?",
          sender: "assistant",
          timestamp: new Date(),
        }]);
      } else {
        setMessages([]);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]); // si cambia sessionId, cargamos su historial

  // 4) Guardar mensajes en localStorage ante cualquier cambio
  useEffect(() => {
    const serializable: SerializableMessage[] = messages.map(m => ({
      ...m,
      timestamp: m.timestamp.toISOString(),
    }));

    const MAX = 100;
    const trimmed = serializable.slice(-MAX);

    saveMessages(sessionId, trimmed);
  }, [messages, sessionId]);

  // -- API call existente --
  const callChatAPI = async (question: string): Promise<string> => {
    const res = await fetch(apiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: question,
        role: userRole,
        session_id: sessionId,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status} - ${text}`);
    }
    const data = await res.json();
    return data.answer as string;
  };

  // -- envío de mensaje + persistencia automática por el useEffect de arriba --
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const response = await callChatAPI(text);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const fallback =
        "Lo siento, ocurrió un problema al contactar al servicio. Intenta nuevamente.";

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: fallback,
          sender: "assistant",
          timestamp: new Date(),
        },
      ]);

      toast({
        title: "Error de conexión",
        description:
          error instanceof Error ? error.message : "No se pudo enviar el mensaje.",
        variant: "destructive",
      });

      onError?.(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div
      className={`bg-background border shadow-chat rounded-xl overflow-hidden flex flex-col h-[600px] max-w-md w-full ${className}`}
    >
      <ChatHeader userRole={userRole} onClose={onClose} />

      <ScrollArea className="flex-1 p-0">
        <div className="space-y-0">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {isTyping && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
    </div>
  );
};
