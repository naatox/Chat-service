import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Minimize2, Maximize2, X } from "lucide-react";
import insecapLogo from "@/assets/insecap-logo4.png";
import capinMascot from "@/assets/capin-mascot.png";

interface ChatHeaderProps {
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  onClose?: () => void;
  userRole?: string;
}

export const ChatHeader = ({ 
  isMinimized, 
  onToggleMinimize, 
  onClose,
  userRole = "" 
}: ChatHeaderProps) => {
  return (
    <div className="bg-gradient-primary text-white p-4 rounded-t-xl shadow-chat">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src={insecapLogo} 
            alt="Insecap" 
            className="h-12 w-auto"
          />
          <div className="border-l border-white/20 pl-3">
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8 border-2 border-white/30">
                <AvatarImage src={capinMascot} alt="Capin" />
                <AvatarFallback className="bg-white text-primary text-xs">C</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold text-lg">CapinIA</h2>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs cursor-pointer">
                    {userRole}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce-gentle"></div>
                    <span className="text-xs opacity-90">En línea</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onToggleMinimize && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleMinimize}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              {isMinimized ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </Button>
          )}
          
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};