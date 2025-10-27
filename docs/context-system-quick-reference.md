# Sistema de Contexto TMS - Guía Rápida

## 🚀 Inicio Rápido

### Para Usuarios TMS

1. **Ver el botón "+"**: Aparece a la izquierda del input de texto
2. **Agregar contexto**: 
   - Click en "+"
   - Seleccionar tipo (Comercialización, Curso, Relator, Alumno)
   - Ingresar ID o RUT
   - Click "Añadir"
3. **Ver contextos agregados**: Aparecen como tarjetas de colores sobre el input
4. **Eliminar contexto**: Click en "×" de la tarjeta
5. **Enviar mensaje**: Escribir consulta y enviar (contextos se limpian automáticamente)

### Para Desarrolladores

#### Tipos de Contexto

```typescript
type ContextObjectType = 
  | "comercializacion"  // ID numérico
  | "curso"             // Código alfanumérico
  | "relator"           // RUT
  | "alumno";           // RUT

interface ContextObject {
  id: string;           // UUID
  type: ContextObjectType;
  identifier: string;   // ID o RUT
  label: string;        // Para UI
}
```

#### Payload Esperado en Backend

```json
{
  "message": "texto de la consulta",
  "intent": "free_mode",
  "role": "tms:coordinador",
  "claims": {
    "objects": [
      { "type": "curso", "identifier": "R-ADM-101" },
      { "type": "alumno", "identifier": "12345678-9" }
    ]
  }
}
```

#### Verificar Contextos en DevTools

```javascript
// En la consola del navegador:
// 1. Abrir DevTools (F12)
// 2. Tab "Console"
// 3. Buscar logs que inicien con [PAYLOAD VERIFICATION]
// 4. Verificar el campo "contexts: X"

// Ejemplo:
[PAYLOAD VERIFICATION] modeCandidate: guided, source: chat_input, 
intent: free_mode, role: tms:coordinador, 
session_id: abc-123, contexts: 2
```

## 🎨 Componentes

### ContextMenu
**Archivo**: `src/components/ContextMenu.tsx`  
**Propósito**: Popover para agregar contextos

```tsx
<ContextMenu 
  onAddContext={handleAddContext}
  disabled={false}
  contextCount={contexts.length}
  maxContexts={5}
/>
```

### ContextCard
**Archivo**: `src/components/ContextCard.tsx`  
**Propósito**: Tarjeta visual de contexto

```tsx
<ContextCard 
  context={{
    id: "uuid-123",
    type: "curso",
    identifier: "R-ADM-101",
    label: "Curso"
  }}
  onRemove={handleRemove}
/>
```

### ChatInput
**Archivo**: `src/components/ChatInput.tsx`  
**Propósito**: Input con soporte de contextos

```tsx
<ChatInput
  onSendMessage={(text, contexts) => console.log(text, contexts)}
  showContextMenu={true} // Solo para TMS
  disabled={false}
  inputRef={inputRef}
/>
```

## 🔧 Configuración

### Límites
- **Max contextos por mensaje**: 5
- **Max longitud identificador**: Sin límite (truncado visualmente en 200px)
- **Roles permitidos**: Solo TMS (todos los subroles)

### Colores por Tipo

| Tipo | Color |
|------|-------|
| Comercialización | Azul |
| Curso | Verde |
| Relator | Púrpura |
| Alumno | Naranja |

## 🐛 Debugging

### Verificar si el botón "+" aparece

```typescript
// En CapinChat.tsx, línea ~1450
const isTmsRole = selectedRole === "tms";

// Verificar en DevTools:
// React DevTools → CapinChat → props → isTmsRole
```

### Verificar payload enviado

```javascript
// En CapinChat.tsx, función callChatAPI
console.info(`[PAYLOAD VERIFICATION] ...`);

// O en Network tab:
// 1. Filtrar por endpoint de chat
// 2. Ver request payload
// 3. Buscar "claims.objects"
```

### Verificar contextos en estado

```javascript
// En React DevTools:
// ChatInput → hooks → State[2] → contexts
// Debe ser un array de ContextObject
```

## 🧪 Tests Rápidos

### Test 1: Agregar y Eliminar
```
1. Login como TMS
2. Click "+"
3. Seleccionar "Curso"
4. Ingresar "R-ADM-101"
5. Añadir → ✅ Aparece tarjeta verde
6. Click "×" → ✅ Tarjeta desaparece
```

### Test 2: Enviar con Contextos
```
1. Agregar 2 contextos
2. Escribir mensaje
3. Enviar
4. Abrir DevTools → Network
5. Verificar payload → ✅ Incluye claims.objects
6. Verificar UI → ✅ Contextos desaparecen
```

### Test 3: Límite de 5
```
1. Agregar 5 contextos
2. Intentar agregar 6to
3. ✅ Botón "+" deshabilitado
```

## 📋 Checklist de Integración Backend

- [ ] Endpoint recibe `claims.objects`
- [ ] Valida tipos de contexto permitidos
- [ ] Procesa `intent: "free_mode"` correctamente
- [ ] Usa contextos para mejorar búsqueda RAG
- [ ] Maneja caso de `claims.objects` vacío
- [ ] Logs de telemetría incluyen información de contextos
- [ ] Respuestas incluyen referencias a contextos usados

## 🔗 Archivos Modificados

```
src/components/
  ├── ContextMenu.tsx         (NUEVO)
  ├── ContextCard.tsx         (NUEVO)
  ├── ChatInput.tsx           (MODIFICADO)
  └── CapinChat.tsx           (MODIFICADO)

docs/
  └── context-system-implementation.md  (NUEVO)
  └── context-system-quick-reference.md (NUEVO)
```

## 💡 Tips

1. **Usar enter en el formulario**: Presiona Enter para agregar rápidamente
2. **Ver contextos antes de enviar**: Revisa las tarjetas antes de enviar
3. **Contextos temporales**: Se limpian automáticamente después de enviar
4. **Solo para TMS**: Otros roles no verán el botón "+"
5. **Free mode automático**: Todo mensaje de input usa free_mode

## 🚨 Troubleshooting

### Problema: Botón "+" no aparece
**Solución**: Verificar que el rol sea TMS (`selectedRole === "tms"`)

### Problema: Contextos no se envían
**Solución**: Verificar que `callChatAPI` recibe el parámetro `contexts`

### Problema: TypeScript error en ContextObject
**Solución**: Verificar que ContextObject está re-exportado en ChatInput.tsx

### Problema: Botón "+" siempre deshabilitado
**Solución**: Verificar prop `maxContexts` y `contextCount` en ContextMenu

### Problema: Contextos no se limpian después de enviar
**Solución**: Verificar `setContexts([])` en `handleSubmit` de ChatInput

## 📞 Contacto y Soporte

Para preguntas o issues relacionados con el sistema de contexto:
1. Revisar documentación completa en `docs/context-system-implementation.md`
2. Verificar logs de consola con filtro `[PAYLOAD VERIFICATION]`
3. Usar React DevTools para inspeccionar estado de componentes
4. Revisar Network tab para verificar payloads enviados

---

**Última actualización**: 2024  
**Versión del sistema**: 1.0
