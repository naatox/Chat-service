import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserSearch } from "lucide-react";
import { RelatorSearchModal } from "./RelatorSearchModal";
import { sendCustomTelemetry } from "@/lib/telemetry";

interface RelatorQuickActionProps {
  onActionSend: (payload: {
    source: string;
    intent: string;
    message: string;
    target?: { rut?: string; nombre?: string };
  }) => void;
  disabled?: boolean;
  currentRole?: string;
}

export const RelatorQuickAction = ({ 
  onActionSend, 
  disabled = false,
  currentRole = ""
}: RelatorQuickActionProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    // Telemetría: click en quick action relator
    sendCustomTelemetry("tms_find_relator_click", {});
    setIsModalOpen(true);
  };

  const handleSearchSubmit = (target: { rut?: string; nombre?: string }) => {
    // Construir payload exacto según especificación
    const payload = {
      source: "quick_action",
      intent: "tms.find_relator",
      message: "Buscar Relator",
      target
    };

    onActionSend(payload);
    setIsModalOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={disabled}
        className="flex flex-col items-center gap-1 h-16 w-16 p-2 bg-purple-500 hover:bg-purple-600 text-white border-purple-600 hover:border-purple-700 transition-all duration-200 hover:scale-105 hover:shadow-md rounded-md"
        title="Buscar información de relator"
      >
        <UserSearch className="h-4 w-4" />
        <span className="text-xs font-medium leading-tight">Relator</span>
      </Button>

      <RelatorSearchModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSearchSubmit={handleSearchSubmit}
      />
    </>
  );
};