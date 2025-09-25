import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FileText, Calculator, ClipboardList, Calendar } from "lucide-react";

export type TmsActionType = 'R11' | 'R12' | 'R61' | 'BLOQUES';

interface TmsQuickActionsProps {
  onActionClick: (action: TmsActionType) => void;
  disabled?: boolean;
  isMobile?: boolean;
}

export const TmsQuickActions = ({ onActionClick, disabled = false, isMobile = false }: TmsQuickActionsProps) => {
  const actions = [
    {
      type: 'R11' as TmsActionType,
      label: 'Consultar R11',
      icon: FileText,
      description: 'Información del R11',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      type: 'R12' as TmsActionType,
      label: 'Consultar R12',
      icon: Calculator,
      description: 'Costos R12',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      type: 'R61' as TmsActionType,
      label: 'Consultar R61',
      icon: ClipboardList,
      description: 'Registros R61',
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      type: 'BLOQUES' as TmsActionType,
      label: 'Consultar Bloques',
      icon: Calendar,
      description: 'Información de bloques',
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ];

  return (
    <div className="border-b bg-background/70">
      <Accordion type="single" collapsible defaultValue={isMobile ? undefined : "tms"}>
        <AccordionItem value="tms" className="border-b-0">
          <AccordionTrigger 
            className="px-4 pt-3 pb-2 text-xs text-muted-foreground hover:no-underline"
            aria-label="Mostrar/ocultar acciones TMS"
          >
            Preguntas frecuentes TMS
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-2 pt-0">
            <div className="grid grid-cols-2 gap-2">
              {actions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.type}
                    variant="outline"
                    size="sm"
                    onClick={() => onActionClick(action.type)}
                    disabled={disabled}
                    className={`
                      h-auto p-2 flex flex-col items-center gap-1 text-white border-none
                      ${action.color} disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all duration-200 hover:scale-105 hover:shadow-md rounded-md
                    `}
                    title={action.description}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs font-medium leading-tight">{action.label}</span>
                  </Button>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};