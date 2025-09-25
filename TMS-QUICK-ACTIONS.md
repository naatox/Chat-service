# 🚀 Funcionalidad TMS - Preguntas Frecuentes

## ✅ Implementación Completada

### **Componentes Creados:**

1. **`TmsQuickActions.tsx`** - Panel con 4 botones de acciones rápidas
2. **`CourseCodeModal.tsx`** - Modal para captura de código de curso
3. **`tmsPrompts.ts`** - Generador de prompts explícitos para el LLM
4. **Integración en `CapinChat.tsx`** - Lógica principal y UI

### **Funcionalidades:**

#### **🎯 Visibilidad Condicional**
- Los botones **solo aparecen** para roles que empiecen con `tms:` 
- Ejemplos: `tms:logística`, `tms:postcurso`, `tms:coordinador`, etc.

#### **🔘 4 Acciones Rápidas**
1. **Consultar R11** (azul) - Información del R11, objetivos, contenidos, horas
2. **Consultar R12** (verde) - Costos R12 desglosados
3. **Consultar R61** (naranja) - Registros R61 y contenidos específicos  
4. **Consultar Bloques** (morado) - Lista de bloques con fechas y relatores

#### **📝 Modal de Código de Curso**
- **Input validado** con patrón: `^[A-Z]{1,2}-[A-Z]{3,4}-\d{3,6}$`
- **Autocompletado** del último código usado (localStorage)
- **Ejemplos mostrados**: ES-COM-1352, P-OPE-1012, EA-TEC-001
- **Atajos de teclado**: Enter para confirmar, Escape para cerrar

#### **🤖 Prompts Explícitos Generados**

Al confirmar, se envía al backend un mensaje estructurado:

**Ejemplo R11 para ES-COM-1352:**
```
Solicito explícitamente la información del R11 para el codigoCurso: ES-COM-1352. Entrega:
- Relator creador del R11 (nombre completo)
- Objetivo general
- Población objetivo
- Contenidos específicos R11 (lista con horasT y horasP)
- Nota mínima (si existe)
- Horas teóricas, horas prácticas y total
Usa únicamente la entidad kb_curso que haga match por data.codigoCurso y no mezcles con otros cursos.
```

#### **📡 Payload al Backend**
```json
{
  "message": "<PROMPT_EXPLÍCITO_GENERADO>",
  "role": "tms:logística", 
  "session_id": "<UUIDv4_actual>",
  "user": {
    "sub": "",
    "role": "tms:logística",
    "session_id": "<UUIDv4_actual>", 
    "tenantId": "insecap"
  }
}
```

## 🎨 **UI/UX**

### **Panel de Acciones TMS**
- Aparece **arriba de las sugerencias** cuando role.startsWith('tms:')
- **4 botones coloridos** en grid 2x2 con iconos descriptivos
- **Estados**: Habilitado/Deshabilitado según `isTyping` o `isResettingSession`

### **Tag "Modo TMS"**  
- **Encima del input** cuando rol es TMS
- Muestra: `🔵 Modo TMS • Ctrl+K para R11`
- **Animación**: Punto azul pulsante

### **Modal Intuitivo**
- **Título dinámico** según la acción (R11, R12, R61, Bloques)
- **Descripción específica** de cada consulta
- **Validación en tiempo real** del código
- **Autocompletado** del último código usado

## ⌨️ **Atajos de Teclado**

- **Ctrl+K**: Abrir modal "Consultar R11" (solo en modo TMS)
- **Enter**: Confirmar código en modal
- **Escape**: Cerrar modal

## 💾 **Persistencia**

- **localStorage `tms_last_course_code`**: Guarda el último código ingresado
- Se **autocompleta** en la próxima apertura del modal
- **Facilita consultas repetidas** del mismo curso

## 🔍 **Debugging & Logs**

### **Console Logs:**
```javascript
[TMS ACTION] R11 para curso: ES-COM-1352
[TMS PROMPT] Solicito explícitamente la información del R11 para el codigoCurso: ES-COM-1352. Entrega...
Chat request received - role: tms:logística, raw_role: undefined, session_id: <uuid>, message: Solicito explícitamente...
```

### **Verificar en DevTools:**
```javascript
// Ver último código guardado
localStorage.getItem('tms_last_course_code')

// Verificar que solo aparece para TMS
// Cambiar rol a "tms:logística" -> debería aparecer panel
// Cambiar rol a "publico" -> NO debe aparecer
```

## 🧪 **Tests Manuales**

### **Test 1: Visibilidad Condicional**
1. Seleccionar rol "Público" → ❌ Panel TMS NO debe aparecer
2. Seleccionar rol "TMS" → área "Logística" → ✅ Panel TMS debe aparecer
3. ✅ Tag "Modo TMS • Ctrl+K para R11" debe aparecer encima del input

### **Test 2: Modal y Validación**
1. Click en "Consultar R11" → ✅ Modal se abre con título correcto
2. Escribir "abc" → ❌ Botón "Consultar" deshabilitado, error mostrado
3. Escribir "ES-COM-1352" → ✅ Botón habilitado, sin error
4. Enter → ✅ Modal se cierra, mensaje enviado

### **Test 3: Prompt Generado**
1. Consultar R11 para "P-OPE-1012"
2. ✅ DevTools Network: Ver payload con prompt explícito R11
3. ✅ Console log: `[TMS ACTION] R11 para curso: P-OPE-1012`
4. ✅ Backend recibe el prompt estructurado

### **Test 4: Autocompletado**
1. Ingresar código "ES-COM-1352" y confirmar
2. Cerrar y reabrir cualquier modal TMS
3. ✅ Input debe tener pre-cargado "ES-COM-1352"

### **Test 5: Atajo Ctrl+K**
1. Con rol TMS activo, presionar Ctrl+K
2. ✅ Modal "Consultar R11" debe abrirse automáticamente

## 📋 **Criterios de Aceptación - ✅ COMPLETADOS**

- ✅ Los 4 botones solo aparecen con roles `tms:*`
- ✅ Al confirmar modal, se ve en backend el message con prompt explícito correcto
- ✅ Se mantiene el `session_id` actual en el payload
- ✅ Validación de código con patrón flexible
- ✅ Autocompletado desde localStorage
- ✅ Atajo Ctrl+K para R11
- ✅ Tag "Modo TMS" encima del input
- ✅ Estados disabled durante typing/reset de sesión

## 🔄 **Próximos Pasos (Backend)**

El frontend está **100% completo**. El backend debe:

1. **Detectar prompts explícitos TMS** y usar solo `kb_curso` matching por `data.codigoCurso`
2. **No mezclar cursos** en la respuesta cuando se usa prompt explícito
3. **Formatear respuestas** según las reglas TMS (R11/R12/R61/Bloques)
4. **Logging específico** para acciones TMS

### **Backend Response Esperado:**
```json
{
  "answer": "## R11 - ES-COM-1352\n\n**Relator creador:** Juan Pérez González\n**Objetivo general:** Desarrollar competencias...",
  "citations": [
    {
      "id": "kb_curso:1352",
      "title": "ES-COM-1352 - Información R11",
      "url": null
    }
  ],
  "session_id": "<uuid>",
  "meta": {
    "tms_action": "R11",
    "course_code": "ES-COM-1352",
    "explicit_prompt": true
  }
}
```

---

🎉 **La funcionalidad TMS está lista para usar!** 🚀