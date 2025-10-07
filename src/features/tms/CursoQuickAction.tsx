import React from "react";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

interface CursoQuickActionProps {
  disabled?: boolean;
  currentRole?: string;
}

export const CursoQuickAction = ({ 
  disabled = false,
  currentRole = ""
}: CursoQuickActionProps) => {

  const handleClick = () => {

  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={disabled}
      className="flex flex-col items-center gap-1 h-16 w-16 p-2 bg-blue-500 hover:bg-blue-600 text-white border-blue-600 hover:border-blue-700 transition-all duration-200 hover:scale-105 hover:shadow-md rounded-md"
      title="Consultar curso"
    >
      <BookOpen className="h-4 w-4" />
      <span className="text-xs font-medium leading-tight">Curso</span>
    </Button>
  );
};