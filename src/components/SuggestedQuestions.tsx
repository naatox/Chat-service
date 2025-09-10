import { Button } from "@/components/ui/button";

type Props = {
  onAsk: (display: string, actual?: string) => void;
  role?: string;
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

export const SuggestedQuestions = ({ onAsk, role }: Props) => {
  if (role !== "alumno") return null;

  return (
    <div className="px-4 pt-3 pb-2 border-b bg-background/70">
      <div className="text-xs text-muted-foreground mb-2">
        Preguntas rápidas
      </div>
      <div className="flex flex-wrap gap-2">
        {alumnoQuestions.map((q) => (
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
    </div>
  );
};
