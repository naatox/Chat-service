import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type Props = {
  onAsk: (display: string, actual?: string) => void;
  role?: string;
  isMobile?: boolean;
  disabled?: boolean;
};

const alumnoQuestions = [
  {
    label: "Ver mis notas",
    prompt:
      "Muéstrame mis notas del alumno actual. Si hay varias asignaturas, lista cada curso con sus notas en viñetas.",
  },
  {
    label: "Mi asistencia",
    prompt:
      "Muéstrame mi asistencia (porcentaje y detalle si existe) del alumno actual. Resume por curso. No mezcles las notas con asistencia",
  },
  {
    label: "Cursos inscritos",
    prompt: `Muéstrame mis cursos inscritos del alumno actual. 
Devuelve ÚNICAMENTE el listado de cursos numerado (1., 2., 3., …), SIN incluir notas ni comentarios adicionales.
Usa EXACTAMENTE este estilo:

1. Nombre del curso 1 + codigoUnico
2. Nombre del curso 2 + codigoUnico
3. Nombre del curso 3 + codigoUnico

No agregues encabezados, ni texto extra; solo el listado numerado de cursos.`,
  },
];

const relatorQuestions = [
  {
    label: "Mis cursos dictados",
    prompt:
      "Muéstrame los cursos que estoy dictando actualmente como relator. Lista cada curso con sus detalles básicos.",
  },
  {
    label: "Mi agenda próxima",
    prompt:
      "Muéstrame mi agenda próxima como relator, incluyendo fechas y horarios de mis clases programadas. En caso de no existir, indícalo claramente.",
  },
  {
    label: "Cursos realizados en este año",
    prompt:
      "Muéstrame todos los cursos que he dictado en este año como relator, organizados por fecha. Si no existen cursos este año, indícalo claramente.",
  },

];

const clienteQuestions = [
  {
    label: "Cursos inscritos",
    prompt:
      "Muéstrame todos mis cursos activos y pasados como cliente (página 1). Devuelve solo la página solicitada y adjunta meta de paginación.",
  },
  {
    label: "Mis cursos",
    prompt:
      "Muéstrame todos mis cursos (comercializaciones) activos y pasados como cliente. Lista cada curso con: los nombres de los cursos con valor final en CLP, fechas (inicio y término con formato [día] de [mes] del [año]).",
  },
  {
    label: "Estado de pagos",
    prompt:
      "Muéstrame el estado comercial, indicado dentro de data antes de los contactos. En caso de que el estado sea distinto a Sin deudas: indícame por cada curso, solamente el nombre y el estado de pago de cada uno. Si hay pagos pendientes, indícalo claramente.",
  },
  {
    label: "Certificados disponibles",
    prompt:
      "Muéstrame los certificados que puedo descargar de los cursos completados. Lista por curso finalizado.",
  },
  {
    label: "Próximos cursos",
    prompt:
      "Muéstrame los próximos cursos disponibles que puedo inscribir según mi perfil de cliente.",
  },
];

export const SuggestedQuestions = ({ onAsk, role, isMobile = false, disabled = false }: Props) => {
  if (role !== "alumno" && role !== "relator" && role !== "cliente") return null;

  let questions;
  let titleText;
  
  if (role === "alumno") {
    questions = alumnoQuestions;
    titleText = "Preguntas rápidas";
  } else if (role === "relator") {
    questions = relatorQuestions;
    titleText = "Consultas de relator";
  } else if (role === "cliente") {
    questions = clienteQuestions;
    titleText = "Consultas de cliente";
  }

  return (
    <div className="border-b bg-background/70">
      <Accordion type="single" collapsible defaultValue={isMobile ? undefined : "sug"}>
        <AccordionItem value="sug" className="border-b-0">
          <AccordionTrigger 
            className="px-4 pt-3 pb-2 text-xs text-muted-foreground hover:no-underline"
            aria-label={`Mostrar/ocultar ${titleText.toLowerCase()}`}
          >
            {titleText}
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-2 pt-0">
            <div className="flex flex-wrap gap-2">
              {questions.map((q) => (
                <Button
                  key={q.label}
                  variant="outline"
                  size="sm"
                  onClick={() => onAsk(q.label, q.prompt)}
                  disabled={disabled}
                  className="rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {q.label}
                </Button>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
