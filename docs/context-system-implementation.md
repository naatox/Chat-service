# Sistema de Contexto para Rol TMS

## 📋 Descripción General

El sistema de contexto permite a los usuarios con rol **TMS** adjuntar objetos de contexto a sus consultas, mejorando las capacidades de RAG (Retrieval-Augmented Generation) del backend. Los contextos proporcionan información estructurada que ayuda al sistema a buscar y procesar información específica.

## 🎯 Características Principales

### 1. **Tipos de Contexto Soportados**
- **Comercialización** (ID numérico)
- **Curso** (Código alfanumérico)
- **Relator** (RUT)
- **Alumno** (RUT)

### 2. **Límites y Restricciones**
- Máximo **5 contextos** por mensaje
- Disponible solo para rol **TMS** (todos los subroles)
- Los contextos se limpian automáticamente después de enviar el mensaje

### 3. **Integración con Intents**
- Cualquier mensaje enviado desde el input de texto (no desde botones de acción rápida) utiliza el intent **`free_mode`**
- Los contextos se envían en el campo `claims.objects` del payload
- Compatible con el sistema de paginación existente

## 🏗️ Arquitectura

### Componentes Creados

#### 1. `ContextMenu.tsx`
**Propósito**: Popover con menú de dos pasos para agregar contextos

**Props**:
```typescript
interface ContextMenuProps {
  onAddContext: (context: ContextObject) => void;
  disabled?: boolean;
  contextCount: number;
  maxContexts?: number; // default: 5
}
```

**Flujo**:
1. Vista de selección de tipo (4 opciones con iconos)
2. Formulario para ingresar identificador
3. Validación y agregación del contexto

**Características**:
- Icono "+" en botón principal
- Deshabilita cuando se alcanza el máximo
- Soporte para tecla Enter en el formulario
- Auto-cierre después de agregar

#### 2. `ContextCard.tsx`
**Propósito**: Tarjeta visual para mostrar contextos agregados

**Props**:
```typescript
interface ContextCardProps {
  context: ContextObject;
  onRemove: (id: string) => void;
}
```

**Características**:
- Colores diferenciados por tipo:
  - 🏢 Comercialización: Azul (`blue-500`)
  - 📖 Curso: Verde (`green-500`)
  - 👤 Relator: Púrpura (`purple-500`)
  - 🎓 Alumno: Naranja (`orange-500`)
- Icono específico por tipo
- Botón "X" para eliminar
- Truncado de identificadores largos (max 200px)
- Animación de entrada suave

#### 3. Modificaciones en `ChatInput.tsx`

**Estado agregado**:
```typescript
const [contexts, setContexts] = useState<ContextObject[]>([]);
```

**Handlers agregados**:
```typescript
const handleAddContext = (context: ContextObject) => {
  if (contexts.length < 5) {
    setContexts(prev => [...prev, context]);
  }
};

const handleRemoveContext = (id: string) => {
  setContexts(prev => prev.filter(c => c.id !== id));
};
```

**Cambios en la interfaz**:
```typescript
interface ChatInputProps {
  onSendMessage: (text: string, contexts?: ContextObject[]) => void;
  showContextMenu?: boolean; // Solo true para TMS
  // ... props existentes
}
```

**Layout actualizado**:
```tsx
{/* Área de contextos */}
{contexts.length > 0 && (
  <div className="flex flex-wrap gap-2 mb-3">
    {contexts.map(ctx => (
      <ContextCard key={ctx.id} context={ctx} onRemove={handleRemoveContext} />
    ))}
  </div>
)}

{/* Fila de input con botón + */}
<div className="flex gap-2 items-end">
  {showContextMenu && (
    <ContextMenu 
      onAddContext={handleAddContext}
      contextCount={contexts.length}
      maxContexts={5}
    />
  )}
  <Textarea ... />
  <Button ... />
</div>
```

#### 4. Modificaciones en `CapinChat.tsx`

**Import actualizado**:
```typescript
import { ChatInput, type ContextObject } from "./ChatInput";
```

**Función `handleSendMessage` actualizada**:
```typescript
const handleSendMessage = async (
  display: string, 
  actual?: string, 
  contexts?: ContextObject[]
) => {
  // ... lógica existente
}
```

**Función `callChatAPI` actualizada**:
```typescript
const callChatAPI = async (
  question: string,
  pageOverride?: number,
  contexts?: ContextObject[]
): Promise<ChatApiResponse> => {
  // ... construcción de claims
  
  // Agregar objects de contexto
  if (contexts && contexts.length > 0) {
    const objects = contexts.map(ctx => ({
      type: ctx.type,
      identifier: ctx.identifier
    }));
    
    claims = {
      ...(claims || {}),
      objects
    };
  }
  
  // ... resto del payload
}
```

**Intent detection actualizada**:
```typescript
// Determinar intent: free_mode para chat_input, específico para quick_action
const isFromQuickAction = payloadSource === "quick_action";
const effectiveIntent = isFromQuickAction ? payloadIntent : "free_mode";
```

**Renderizado de ChatInput**:
```tsx
<ChatInput 
  onSendMessage={(text, contexts) => handleSendMessage(text, undefined, contexts)}
  showContextMenu={isTmsRole} // Solo visible para TMS
  disabled={isTyping || isResettingSession}
  inputRef={inputRef}
/>
```

## 🔄 Flujo de Datos

### Agregar Contexto

```
Usuario (TMS) → Click "+" → Seleccionar tipo → Ingresar identificador
  ↓
handleAddContext()
  ↓
contexts state actualizado
  ↓
ContextCard renderizado
```

### Enviar Mensaje con Contextos

```
Usuario escribe mensaje → Presiona Enter o Click "Enviar"
  ↓
handleSubmit() en ChatInput
  ↓
onSendMessage(text, contexts)
  ↓
handleSendMessage() en CapinChat
  ↓
callChatAPI(question, undefined, contexts)
  ↓
claims.objects = contexts.map(...)
  ↓
Payload enviado al backend con:
  - intent: "free_mode"
  - source: "chat_input"
  - claims.objects: [{ type, identifier }, ...]
```

### Limpieza Post-Envío

```
handleSubmit()
  ↓
onSendMessage(text, contexts)
  ↓
setMessage("")
setContexts([]) ← Limpia los contextos
```

## 📦 Estructura del Payload

### Payload Completo con Contextos

```json
{
  "message": "¿Cuántos alumnos tiene este curso?",
  "role": "tms:coordinador",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "source": "chat_input",
  "intent": "free_mode",
  "user": {
    "sub": "",
    "role": "tms:coordinador",
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "tenantId": "insecap",
    "claims": {
      "objects": [
        {
          "type": "curso",
          "identifier": "R-ADM-101"
        },
        {
          "type": "comercializacion",
          "identifier": "150"
        }
      ]
    }
  }
}
```

### Payload sin Contextos (Free Mode)

```json
{
  "message": "¿Cuáles son los cursos más populares?",
  "role": "tms:coordinador",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "source": "chat_input",
  "intent": "free_mode",
  "user": {
    "sub": "",
    "role": "tms:coordinador",
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "tenantId": "insecap"
  }
}
```

### Payload desde Quick Action (Guided Mode)

```json
{
  "message": "Dame los detalles del curso R-ADM-101",
  "role": "tms:coordinador",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "source": "quick_action",
  "intent": "curso_especifico",
  "user": {
    "sub": "",
    "role": "tms:coordinador",
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "tenantId": "insecap"
  }
}
```

## 🎨 UX/UI

### Estados Visuales

#### Sin Contextos
```
[+] [________________Textarea________________] [Enviar]
```

#### Con 3 Contextos
```
[🏢 COM-150 ×] [📖 R-ADM-101 ×] [👤 12345678-9 ×]

[+] [________________Textarea________________] [Enviar]
```

#### Con 5 Contextos (Máximo)
```
[🏢 150 ×] [📖 R-ADM-101 ×] [👤 12345678-9 ×] [🎓 98765432-1 ×] [📖 R-VEN-202 ×]

[+*] [________________Textarea________________] [Enviar]
    ↑ Botón deshabilitado
```

### Colores de Contexto

| Tipo | Color | Código Tailwind | Icono |
|------|-------|----------------|-------|
| Comercialización | Azul | `bg-blue-100 border-blue-500 text-blue-700` | 🏢 Building2 |
| Curso | Verde | `bg-green-100 border-green-500 text-green-700` | 📖 BookOpen |
| Relator | Púrpura | `bg-purple-100 border-purple-500 text-purple-700` | 👤 User |
| Alumno | Naranja | `bg-orange-100 border-orange-500 text-orange-700` | 🎓 GraduationCap |

## 🔍 Validaciones

### Frontend

1. **Máximo de contextos**: No permite agregar más de 5
2. **Input vacío**: No permite enviar mensajes vacíos
3. **Identificador vacío**: No permite agregar contextos sin identificador
4. **Role check**: Botón "+" solo visible para `isTmsRole`

### Tipos TypeScript

```typescript
export type ContextObjectType = 
  | "comercializacion" 
  | "curso" 
  | "relator" 
  | "alumno";

export interface ContextObject {
  id: string; // UUID generado con crypto.randomUUID()
  type: ContextObjectType;
  identifier: string; // ID o RUT según el tipo
  label: string; // Nombre del tipo para UI
}
```

## 🧪 Testing Manual

### Test Case 1: Agregar Contexto
1. Iniciar sesión como TMS (cualquier subrol)
2. Verificar que aparece el botón "+"
3. Click en "+"
4. Seleccionar "Comercialización"
5. Ingresar ID "150"
6. Click en "Añadir"
7. **Resultado esperado**: Aparece tarjeta azul con "🏢 150 ×"

### Test Case 2: Máximo de Contextos
1. Agregar 5 contextos distintos
2. Verificar que el botón "+" se deshabilita
3. **Resultado esperado**: Botón "+" con opacidad reducida y no clickeable

### Test Case 3: Eliminar Contexto
1. Agregar 3 contextos
2. Click en "×" del contexto del medio
3. **Resultado esperado**: Contexto eliminado, solo quedan 2

### Test Case 4: Enviar con Contextos
1. Agregar 2 contextos (curso y alumno)
2. Escribir "¿Cómo va este alumno en el curso?"
3. Enviar
4. Abrir DevTools → Network → Buscar request al endpoint de chat
5. **Resultado esperado**: 
   - Payload incluye `intent: "free_mode"`
   - Payload incluye `claims.objects` con 2 elementos
   - Input limpio después de enviar
   - Contextos desaparecen

### Test Case 5: Sin Contextos (Free Mode)
1. NO agregar contextos
2. Escribir "¿Cuáles son los cursos disponibles?"
3. Enviar
4. **Resultado esperado**:
   - Payload incluye `intent: "free_mode"`
   - Payload NO incluye `claims.objects`

### Test Case 6: Visibilidad por Rol
1. Cambiar a rol "cliente", "alumno" o "relator"
2. **Resultado esperado**: Botón "+" NO aparece
3. Cambiar a rol TMS
4. **Resultado esperado**: Botón "+" aparece

## 📊 Logs de Debugging

### Console.info en callChatAPI
```javascript
console.info(
  `[PAYLOAD VERIFICATION] modeCandidate: ${modeCandidate}, ` +
  `source: ${payloadSource}, ` +
  `intent: ${effectiveIntent || 'undefined'}, ` +
  `role: ${finalRole}, ` +
  `session_id: ${sessionId}, ` +
  `contexts: ${contexts?.length || 0}`
);
```

**Ejemplo de output**:
```
[PAYLOAD VERIFICATION] modeCandidate: guided, source: chat_input, 
intent: free_mode, role: tms:coordinador, 
session_id: 550e8400-e29b-41d4-a716-446655440000, contexts: 2
```

## 🔄 Compatibilidad

### Con Sistema de Paginación
- Los contextos **NO** se incluyen en requests de paginación
- La paginación mantiene el último intent del quick action
- El free_mode **NO** soporta paginación automática

### Con Quick Actions
- Los quick actions **NO** usan free_mode
- Mantienen sus intents específicos (ej: `curso_especifico`)
- Los contextos solo aplican a mensajes desde el input

### Con Modo Guiado/Libre
- **Free Mode**: `source: "chat_input"` + `intent: "free_mode"`
- **Guided Mode**: `source: "quick_action"` + `intent: <específico>`
- Los contextos pueden usarse en ambos modos (aunque principalmente en free)

## 🚀 Futuras Mejoras

### Posibles Extensiones
1. **Autocompletado**: Sugerir IDs/códigos mientras se escribe
2. **Validación avanzada**: Verificar formato de RUTs o códigos
3. **Histórico**: Recordar contextos usados recientemente
4. **Drag & Drop**: Arrastrar contextos de mensajes anteriores
5. **Iconos custom**: Permitir que el backend envíe metadatos de contextos
6. **Multi-idioma**: Internacionalización de labels y placeholders

### Optimizaciones
1. **Debouncing**: En validación de identificadores
2. **Memo**: Optimizar re-renders de ContextCard
3. **Virtual Scrolling**: Si se permiten más de 5 contextos en el futuro

## 📝 Notas de Implementación

### Decisiones de Diseño

1. **¿Por qué máximo 5 contextos?**
   - Evita sobrecarga del payload
   - Mantiene UI limpia y manejable
   - Suficiente para casos de uso típicos

2. **¿Por qué solo TMS?**
   - Rol con mayor necesidad de contexto complejo
   - Otros roles tienen flujos más específicos
   - Puede extenderse a otros roles en el futuro

3. **¿Por qué free_mode para todo mensaje de input?**
   - Simplifica lógica de intent detection
   - Permite al backend decidir cómo procesar
   - Mantiene consistencia con sistema de telemetría

4. **¿Por qué limpiar contextos después de enviar?**
   - Evita confusión en mensajes subsecuentes
   - Fuerza intención explícita en cada mensaje
   - Simplifica estado del componente

### Consideraciones de Backend

El backend debe estar preparado para:
1. Recibir `claims.objects` como array de `{ type, identifier }`
2. Procesar `intent: "free_mode"` diferente a intents guiados
3. Validar tipos de contexto soportados
4. Manejar casos donde `claims.objects` es vacío o undefined
5. Usar contextos para mejorar búsqueda RAG

### TypeScript Strictness

Todos los tipos están correctamente definidos:
- No se usa `any`
- Todas las props son tipadas
- Re-exportación de tipos compartidos
- Validación en tiempo de compilación

## 🎓 Aprendizajes

### Patrones Aplicados

1. **Compound Components**: ContextMenu + ContextCard trabajan juntos
2. **Controlled Components**: Estado en ChatInput, props en hijos
3. **Optimistic Updates**: UI responde inmediatamente, backend en background
4. **Single Responsibility**: Cada componente tiene un propósito claro
5. **Prop Drilling Mitigation**: Solo 2 niveles de profundidad

### Tailwind Patterns Usados

```css
/* Animación de entrada */
animate-in fade-in-0 zoom-in-95 duration-200

/* Truncado de texto */
max-w-[200px] truncate

/* Flex wrapping */
flex flex-wrap gap-2

/* Border y colores condicionales */
border-2 border-{color}-500 bg-{color}-100 text-{color}-700

/* Hover effects */
hover:bg-destructive/10 transition-colors
```

## 📚 Referencias

- [Shadcn UI Popover](https://ui.shadcn.com/docs/components/popover)
- [Lucide Icons](https://lucide.dev/)
- [Tailwind CSS Colors](https://tailwindcss.com/docs/customizing-colors)
- [React useState Hook](https://react.dev/reference/react/useState)
- [TypeScript Type Exports](https://www.typescriptlang.org/docs/handbook/modules.html#export)

---

**Versión**: 1.0  
**Fecha**: 2024  
**Autor**: Sistema de Documentación Automática
