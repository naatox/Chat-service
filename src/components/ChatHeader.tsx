import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Trash2, ChevronDown, RotateCcw } from "lucide-react";
import insecapLogo from "@/assets/insecap-logo4.png";
import capinMascot from "@/assets/capin-mascot.png";

type AppRole = "tms" | "publico" | "alumno" | "relator" | "cliente";

interface ChatHeaderProps {
  isMinimized?: boolean;
  userRole?: AppRole;
  onToggleMinimize?: () => void;
  onClose?: () => void;
  onClear?: () => void;
  onResetSession?: () => void; // ADD: Callback para cambiar sesión
  isResettingSession?: boolean; // ADD: Estado para deshabilitar controles

  onChangeRole?: (r: AppRole) => void;
  rut?: string;
  onChangeRut?: (rut: string) => void;
  idCliente?: string;
  onChangeIdCliente?: (v: string) => void;
  correo?: string;
  onChangeCorreo?: (v: string) => void;
  
  // ADD: Props para TMS subrol
  tmsSubrol?: string;
  onChangeTmsSubrol?: (subrol: string) => void;
}

export const ChatHeader = ({
  userRole = "publico",
  onClose,
  onClear,
  onResetSession,
  isResettingSession = false,
  onChangeRole,
  rut = "",
  onChangeRut,
  idCliente = "",
  onChangeIdCliente,
  correo = "",
  onChangeCorreo,
  tmsSubrol = "coordinador",
  onChangeTmsSubrol,
}: ChatHeaderProps) => {
  const showRut = userRole === "alumno" || userRole === "relator" || userRole === "cliente";
  const showCli = userRole === "cliente";
  const showTms = userRole === "tms";

  const tmsSubrolOptions = [
    { value: "coordinador", label: "Coordinador" },
    { value: "comercial", label: "Comercial" },
    { value: "postcurso", label: "Postcurso" },
    { value: "facturacion", label: "Facturación" },
    { value: "logistica", label: "Logística" },
    { value: "administrador", label: "Administrador" },
    { value: "gerencia", label: "Gerencia" },
    { value: "diseno&desarrollo", label: "Diseño & Desarrollo" },
    { value: "diseno", label: "Diseño" },
  ];

  return (
    <div className="bg-gradient-primary text-white p-3 rounded-t-xl shadow-chat">
      <div className="flex items-start justify-between gap-2">
        {/* IZQUIERDA */}
        <div className="flex items-start gap-2 min-w-0">
          <img src={insecapLogo} alt="Insecap" className="h-8 w-auto shrink-0" />
          <div className="border-l border-white/20 pl-2 min-w-0">
            <div className="flex items-center gap-2">
              <Avatar className="w-7 h-7 border border-white/30 shrink-0">
                <AvatarImage src={capinMascot} alt="Capin" />
                <AvatarFallback>CP</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold leading-tight text-sm">CapinIA</span>
                  <Badge variant="outline" className="h-5 px-1.5 border-white/30 text-[11px] text-white/90">
                    Asistente virtual
                  </Badge>
                </div>
                <p className="text-[11px] text-white/70 leading-snug">
                  ¿En qué puedo ayudarte hoy?
                </p>
              </div>
            </div>

            {/* Controles compactos: Rol y (condicional) RUT */}
            <div className="mt-2 flex flex-row flex-wrap items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-white/80">Rol:</span>
                <Select value={userRole} onValueChange={(v: AppRole) => onChangeRole?.(v)}>
                  <SelectTrigger className="h-7 px-2 pr-7 w-[120px] sm:w-[130px] text-xs bg-white/10 border-white/30 text-white">
                    <SelectValue placeholder="Seleccionar rol" />
                    <ChevronDown className="h-3 w-3 ml-auto opacity-60" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="publico">Público</SelectItem>
                    <SelectItem value="alumno">Alumno</SelectItem>
                    <SelectItem value="relator">Relator</SelectItem>
                    <SelectItem value="cliente">Cliente</SelectItem>
                    <SelectItem value="tms">TMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {showRut && (
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-white/80 whitespace-nowrap">RUT:</span>
                  <Input
                    value={rut}
                    onChange={(e) => onChangeRut?.(e.target.value)}
                    placeholder="12.345.678-9"
                    className="h-7 w-[138px] sm:w-[150px] text-xs px-2 bg-white/10 border-white/30 text-white placeholder:text-white/60"
                  />
                </div>
              )}

              {showCli && (
                <>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-white/80 whitespace-nowrap">ID Cliente:</span>
                    <Input
                      value={idCliente}
                      onChange={(e) => onChangeIdCliente?.(e.target.value)}
                      placeholder="CLI-001234"
                      className="h-7 w-[138px] sm:w-[150px] text-xs px-2 bg-white/10 border-white/30 text-white placeholder:text-white/60"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-white/80 whitespace-nowrap">Email:</span>
                    <Input
                      type="email"
                      value={correo}
                      onChange={(e) => onChangeCorreo?.(e.target.value)}
                      placeholder="cliente@dominio.cl"
                      className="h-7 w-[180px] sm:w-[200px] text-xs px-2 bg-white/10 border-white/30 text-white placeholder:text-white/60"
                    />
                  </div>
                </>
              )}

              {showTms && (
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-white/80 whitespace-nowrap">Área:</span>
                  <Select value={tmsSubrol} onValueChange={(v: string) => onChangeTmsSubrol?.(v)}>
                    <SelectTrigger className="h-7 px-2 pr-7 w-[150px] sm:w-[160px] text-xs bg-white/10 border-white/30 text-white">
                      <SelectValue placeholder="Seleccionar área" />
                      <ChevronDown className="h-3 w-3 ml-auto opacity-60" />
                    </SelectTrigger>
                    <SelectContent>
                      {tmsSubrolOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* DERECHA: acciones (compactas) */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onResetSession}
            disabled={isResettingSession}
            className="h-7 px-2 bg-white/10 hover:bg-white/20 border-white/30 text-white disabled:opacity-50"
            title="Cambiar sesión (contexto limpio)"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            disabled={isResettingSession}
            className="h-7 px-2 bg-white/10 hover:bg-white/20 border-white/30 text-white disabled:opacity-50"
            title="Limpiar conversación"
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isResettingSession}
            className="h-7 px-2 bg-white/10 hover:bg-white/20 border-white/30 text-white disabled:opacity-50"
            title="Cerrar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
