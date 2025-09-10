import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import capinMascot from "@/assets/capin-mascot.png";
import { CapinChat } from "./CapinChat";

const ChatWidget = () => {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <div className="fixed right-4 bottom-4 md:right-6 md:bottom-6 z-[60]">
        <div className="relative">
          <Button
            aria-label="Abrir chat CapinIA"
            onClick={() => setOpen(true)}
            className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-gradient-to-br from-primary to-accent shadow-xl hover:scale-110 transition-transform"
          >
            <MessageCircle className="h-7 w-7 md:h-8 md:w-8 text-white" />
          </Button>

          <div className="absolute -top-3 right-0 translate-y-[-100%]">
            {/* Globo completo solo en lg+ */}
            <div className="hidden lg:block bg-white border border-border rounded-xl shadow-lg p-3 w-[72vw] max-w-[420px] min-w-[260px]">
              <div className="flex items-center gap-3">
                <img
                  src={capinMascot}
                  alt="Capin"
                  className="w-8 h-8 rounded-full shrink-0"
                />
                <p className="text-sm sm:text-base leading-5 sm:leading-6 text-foreground">
                  Hola, soy <span className="font-semibold">CapinIA</span>, tu
                  asistente virtual. <br /> ¿En qué puedo ayudarte hoy?
                </p>
              </div>
              <div className="absolute -bottom-2 right-8 h-4 w-4 rotate-45 bg-white border-r border-b border-border" />
            </div>

            {/* Globo reducido para md y menores */}
            <div className="block lg:hidden bg-white border border-border rounded-xl shadow-lg px-2 py-1 min-w-[160px]">
              <div className="flex items-center gap-2">
                <img
                  src={capinMascot}
                  alt="Capin"
                  className="w-6 h-6 rounded-full shrink-0"
                />
                <p className="text-xs leading-4 text-foreground">
                  ¿En qué puedo ayudarte?
                </p>
              </div>
              <div className="absolute -bottom-2 right-4 h-3 w-3 rotate-45 bg-white border-r border-b border-border" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-2 bottom-2 md:inset-auto md:right-6 md:bottom-6 z-[60]">
      <div className="relative mx-auto md:mx-0 w-full [width:min(92vw,440px)]">
        <div className="bg-white border border-border rounded-xl shadow-2xl w-full h-[70vh] max-h-[80vh] md:h-[600px] overflow-hidden">
          <CapinChat
            className="h-full max-w-none w-full"
            apiEndpoint="https://rag-service-qgkc.onrender.com/api/chat"

            sessionScope="guest"
            showWelcome={true}
            onClose={() => setOpen(false)}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatWidget;
