import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import capinMascot from "@/assets/capin-mascot.png";

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  files?: File[];
}

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = message.sender === 'user';

  return (
    <div className={`flex gap-3 p-4 animate-fade-in ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && (
        <Avatar className="w-8 h-8 border-2 border-primary/20">
          <AvatarImage src={capinMascot} alt="Capin" />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">C</AvatarFallback>
        </Avatar>
      )}
      
      <div className={`max-w-[80%] ${isUser ? 'text-right' : 'text-left'}`}>
        <div
          className={`inline-block p-3 rounded-2xl shadow-bubble transition-all duration-300 hover:shadow-lg ${
            isUser
              ? 'bg-chat-user-bg text-chat-user-text rounded-br-md'
              : 'bg-chat-assistant-bg text-chat-assistant-text border-2 border-chat-assistant-border rounded-bl-md'
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{message.text}</p>
          
        </div>
        
        <div className={`flex items-center gap-2 mt-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span className="text-xs text-muted-foreground">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          
          {!isUser && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-6 w-6 p-0 hover:bg-muted"
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3 text-muted-foreground" />
              )}
            </Button>
          )}
        </div>
      </div>
      
      {isUser && (
        <Avatar className="w-8 h-8 bg-primary">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">U</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};