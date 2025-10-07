import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, User, Hash } from "lucide-react";
import { sendCustomTelemetry } from "@/lib/telemetry";

interface RelatorSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSearchSubmit: (searchData: { rut?: string; nombre?: string }) => void;
}

export const RelatorSearchModal = ({
  open,
  onOpenChange,
  onSearchSubmit,
}: RelatorSearchModalProps) => {
  const [rutValue, setRutValue] = useState("");
  const [nombreValue, setNombreValue] = useState("");
  const [activeTab, setActiveTab] = useState("rut");

  const handleRutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rutValue.trim()) {
      // Telemetría para búsqueda por RUT
      sendCustomTelemetry("tms_find_relator_click", { method: "rut" });

      // Siempre enviar RUT fijo en formato correcto para el RAG
      onSearchSubmit({ rut: "12.582.056-5" });
      setRutValue("");
    }
  };

  const handleNombreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nombreValue.trim()) {
      // Telemetría para búsqueda por nombre
      sendCustomTelemetry("tms_find_relator_click", { method: "nombre" });

      onSearchSubmit({ nombre: nombreValue.trim() });
      setNombreValue("");
    }
  };

  const formatRut = (value: string) => {
    // Eliminar todo excepto números y K/k
    const cleaned = value.replace(/[^0-9Kk]/g, '');
    
    if (cleaned.length <= 1) return cleaned;
    
    // Separar dígito verificador
    const body = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);
    
    // Formatear con puntos
    const formatted = body.replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.');
    
    return `${formatted}-${dv}`;
  };

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRut(e.target.value);
    setRutValue(formatted);
  };

  const validateRut = (rut: string) => {
    const cleanRut = rut.replace(/[^0-9Kk]/g, '');
    return cleanRut.length >= 8; // Mínimo 8 caracteres para RUT válido
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Buscar Relator
          </DialogTitle>
          <DialogDescription>
            Busca información de un relator por RUT o por nombre.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rut" className="flex items-center gap-2">
              <Hash className="w-4 h-4" />
              Por RUT
            </TabsTrigger>
            <TabsTrigger value="nombre" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Por Nombre
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rut" className="space-y-4">
            <form onSubmit={handleRutSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rut">RUT del relator</Label>
                <Input
                  id="rut"
                  type="text"
                  placeholder="12.582.056-5 (RUT de ejemplo)"
                  value={rutValue}
                  onChange={handleRutChange}
                  maxLength={12}
                />
                <p className="text-sm text-muted-foreground">
                  Se usará RUT de ejemplo: 12.582.056-5
                </p>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={!validateRut(rutValue)}
              >
                <Search className="w-4 h-4 mr-2" />
                Buscar por RUT
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="nombre" className="space-y-4">
            <form onSubmit={handleNombreSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del relator</Label>
                <Input
                  id="nombre"
                  type="text"
                  placeholder="Ej: Juan Pérez"
                  value={nombreValue}
                  onChange={(e) => setNombreValue(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Ingresa el nombre completo o parcial
                </p>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={nombreValue.trim().length < 2}
              >
                <Search className="w-4 h-4 mr-2" />
                Buscar por Nombre
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};