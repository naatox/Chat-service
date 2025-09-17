import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (text: string) => void; // <- solo texto
  disabled?: boolean;
  inputRef?: React.RefObject<HTMLTextAreaElement>; // ADD
}

export const ChatInput = ({ onSendMessage, disabled, inputRef }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [showCodeHint, setShowCodeHint] = useState(false); // ADD
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage("");

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
        <div className="flex gap-2 items-end">
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
