import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { ContextMenu, type ContextObject } from "./ContextMenu";
import { ContextCard } from "./ContextCard";

// ✅ Re-exportar ContextObject para que pueda ser usado en otros componentes
export type { ContextObject };

interface ChatInputProps {
  onSendMessage: (text: string, contexts?: ContextObject[]) => void; // ✅ Ahora acepta contextos
  disabled?: boolean;
  inputRef?: React.RefObject<HTMLTextAreaElement>;
  showContextMenu?: boolean; // ✅ Para mostrar el botón "+" solo en rol TMS
}

export const ChatInput = ({ onSendMessage, disabled, inputRef, showContextMenu = false }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [showCodeHint, setShowCodeHint] = useState(false);
  const [contexts, setContexts] = useState<ContextObject[]>([]); // ✅ Estado para contextos
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Detectar patrón de código de curso (ADD-ONLY)
  useEffect(() => {
    const courseCodePattern = /^R-[A-Z]{3}-\d+$/i;
    const trimmedMessage = message.trim();
    setShowCodeHint(courseCodePattern.test(trimmedMessage));
  }, [message]);

  // Foco externo desde CapinChat (ADD-ONLY)
  useEffect(() => {
    if (inputRef?.current) {
      inputRef.current.focus();
    }
  }, [inputRef]);

  // ✅ Handlers para contextos
  const handleAddContext = (context: ContextObject) => {
    if (contexts.length < 5) {
      setContexts(prev => [...prev, context]);
    }
  };

  const handleRemoveContext = (id: string) => {
    setContexts(prev => prev.filter(c => c.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (message.trim()) {
      onSendMessage(message.trim(), contexts.length > 0 ? contexts : undefined);
      setMessage("");
      setContexts([]); // ✅ Limpiar contextos después de enviar

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  };

  return (
    <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <form onSubmit={handleSubmit} className="p-4">
        {/* ✅ Display de contextos agregados */}
        {contexts.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {contexts.map(ctx => (
              <ContextCard 
                key={ctx.id} 
                context={ctx} 
                onRemove={handleRemoveContext} 
              />
            ))}
          </div>
        )}

        <div className="flex gap-2 items-end">
          {/* ✅ Botón de contexto (solo para TMS) */}
          {showContextMenu && (
            <ContextMenu 
              onAddContext={handleAddContext} 
              disabled={disabled}
              contextCount={contexts.length}
              maxContexts={5}
            />
          )}

          <div className="flex-1 relative">
            <Textarea
              ref={inputRef || textareaRef}
              value={message}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu consulta aquí..."
              disabled={disabled}
              className="min-h-[44px] max-h-[120px] resize-none pr-12 border-2 focus:border-primary transition-colors"
              rows={1}
            />
            
            {/* Tooltip no intrusivo para códigos de curso (ADD-ONLY) */}
            {showCodeHint && !disabled && (
              <div 
                className="absolute left-0 top-full mt-1 text-xs bg-primary/90 text-primary-foreground rounded-md px-2 py-1 shadow-md z-10 pointer-events-none select-none animate-in fade-in-0 zoom-in-95 duration-200"
                role="tooltip"
                aria-label="Información sobre búsqueda de curso"
              >
                <div className="flex items-center gap-1">
                  <span>🎯</span>
                  <span>Encontraré el curso aunque no esté en esta página</span>
                </div>
                {/* Pequeña flecha apuntando al input */}
                <div className="absolute -top-1 left-3 w-2 h-2 bg-primary/90 rotate-45 transform"></div>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={disabled || !message.trim()}
            className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center"
          >
            <Send className="h-4 w-4"/>
          </Button>
        </div>
      </form>
    </div>
  );
};
