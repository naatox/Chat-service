import { useEffect, useState } from "react";
import { RelatorQuickAction } from "./RelatorQuickAction";
import { CostosQuickAction } from "./CostosQuickAction";
import { CursoQuickAction } from "./CursoQuickAction";
import { actionsRegistry } from "./ActionsRegistry";

interface AdditionalTmsActionsProps {
  currentRole: string;
  onActionSend: (payload: {
    source: string;
    intent: string;
    message: string;
    target?: { rut?: string; nombre?: string; codigoComer?: string };
  }) => void;
  disabled?: boolean;
}

export const AdditionalTmsActions = ({ 
  currentRole, 
  onActionSend, 
  disabled = false 
}: AdditionalTmsActionsProps) => {
  // Estado para forzar re-render cuando cambia el rol
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Registrar las acciones para tms:logistica
  useEffect(() => {
    // Siempre limpiar primero las acciones existentes
    actionsRegistry.unregister("relator-search");
    actionsRegistry.unregister("costos-search");
    actionsRegistry.unregister("curso-search");

    // Solo registrar si es el rol correcto
    if (currentRole === "tms:logistica" || currentRole === "tms:diseno&desarrollo") {
      const relatorAction = {
        id: "relator-search",
        component: (
          <RelatorQuickAction
            onActionSend={onActionSend}
            disabled={disabled}
            currentRole={currentRole}
          />
        ),
        roles: ["tms:logistica", "tms:diseno&desarrollo"],
        order: 1
      };

      actionsRegistry.register(relatorAction);
      
      // Solo registrar costos y curso para logística
      if (currentRole === "tms:logistica") {
        const costosAction = {
          id: "costos-search",
          component: (
            <CostosQuickAction
              disabled={disabled}
              currentRole={currentRole}
              onSubmit={onActionSend}
            />
          ),
          roles: ["tms:logistica"],
          order: 2
        };

        const cursoAction = {
          id: "curso-search",
          component: (
            <CursoQuickAction
              disabled={disabled}
              currentRole={currentRole}
            />
          ),
          roles: ["tms:logistica"],
          order: 3
        };

        actionsRegistry.register(costosAction);
        actionsRegistry.register(cursoAction);
      }
    }

    // Forzar re-render
    setForceUpdate(prev => prev + 1);

    // Cleanup al desmontar
    return () => {
      actionsRegistry.unregister("relator-search");
      actionsRegistry.unregister("costos-search");
      actionsRegistry.unregister("curso-search");
    };
  }, [onActionSend, disabled, currentRole]);

  // Obtener acciones disponibles para el rol actual
  const availableActions = actionsRegistry.getActionsForRole(currentRole);

  if (availableActions.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-2 justify-center" key={`actions-${currentRole}-${forceUpdate}`}>
      {availableActions.map((action) => (
        <div key={action.id}>
          {action.component}
        </div>
      ))}
    </div>
  );
};