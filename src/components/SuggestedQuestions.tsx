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
    label: "Cursos inscritos (numerados)",
    prompt: `Muéstrame mis cursos inscritos del alumno actual. 
Devuelve ÚNICAMENTE el listado de cursos numerado (1., 2., 3., …), SIN incluir notas ni comentarios adicionales.
Usa EXACTAMENTE este estilo:

1. Nombre del curso 1
2. Nombre del curso 2
3. Nombre del curso 3

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
    label: "Mis inscripciones",
    prompt:
      "Muéstrame todas mis inscripciones activas y pasadas como cliente. Lista cada curso con estado y fechas.",
  },
  {
    label: "Estado de pagos",
    prompt:
      "Muéstrame el estado de mis pagos pendientes y realizados. Incluye detalles de facturación si están disponibles.",
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

export const SuggestedQuestions = ({ onAsk, role, isMobile = false }: Props) => {
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
                  className="rounded-full"
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
