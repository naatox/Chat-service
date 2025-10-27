# Diagrama de Flujo - Sistema de Contexto TMS

## 🔄 Flujo Completo del Sistema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          USUARIO TMS (Coordinador)                          │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ├─── Click "+" Botón
                                     │
┌────────────────────────────────────▼────────────────────────────────────────┐
│                             ContextMenu.tsx                                 │
│  ┌───────────────────────────────────────────────────────────────────┐     │
│  │  VISTA 1: Selección de Tipo                                       │     │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐     │     │
│  │  │ 🏢 Comerc. │ │ 📖 Curso   │ │ 👤 Relator │ │ 🎓 Alumno  │     │     │
│  │  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘     │     │
│  └────────┼──────────────┼──────────────┼──────────────┼────────────┘     │
│           │              │              │              │                   │
│           └──────────────┴──────────────┴──────────────┘                   │
│                              │                                              │
│                              │ Usuario selecciona tipo                      │
│                              ▼                                              │
│  ┌───────────────────────────────────────────────────────────────────┐     │
│  │  VISTA 2: Formulario                                              │     │
│  │  ← Volver                                                         │     │
│  │                                                                    │     │
│  │  Tipo: Curso                                                      │     │
│  │  Hint: "Ej: R-ADM-101, S-VEN-205"                                │     │
│  │                                                                    │     │
│  │  ┌──────────────────────────────────┐                            │     │
│  │  │ R-ADM-101                        │ (Input)                    │     │
│  │  └──────────────────────────────────┘                            │     │
│  │                                                                    │     │
│  │                           [Añadir] ◄─── Enter o Click             │     │
│  └───────────────────────────────────────────────────────────────────┘     │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     │ onAddContext({ id, type, identifier, label })
                                     │
┌────────────────────────────────────▼────────────────────────────────────────┐
│                             ChatInput.tsx                                   │
│                                                                              │
│  Estado: contexts = [...]                                                   │
│                                                                              │
│  handleAddContext() {                                                       │
│    if (contexts.length < 5) {                                               │
│      setContexts([...prev, newContext])                                     │
│    }                                                                         │
│  }                                                                           │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────┐     │
│  │  ÁREA DE CONTEXTOS                                                │     │
│  │                                                                    │     │
│  │  ┌──────────────────┐ ┌──────────────────┐                       │     │
│  │  │ 📖 R-ADM-101  × │ │ 🏢 150        × │  (ContextCards)        │     │
│  │  └──────────────────┘ └──────────────────┘                       │     │
│  └───────────────────────────────────────────────────────────────────┘     │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────┐     │
│  │  INPUT ÁREA                                                        │     │
│  │                                                                    │     │
│  │  [+] ┌────────────────────────────────────────┐ [Enviar]         │     │
│  │      │ ¿Cuántos alumnos tiene este curso?    │                   │     │
│  │      └────────────────────────────────────────┘                   │     │
│  └───────────────────────────────────────────────────────────────────┘     │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     │ Usuario presiona Enter o Click Enviar
                                     │
                                     │ handleSubmit()
                                     │   ↓
                                     │ onSendMessage(text, contexts)
                                     │
┌────────────────────────────────────▼────────────────────────────────────────┐
│                            CapinChat.tsx                                    │
│                                                                              │
│  handleSendMessage(text, actual, contexts) {                                │
│    setLastPayload({ source: "chat_input", intent: undefined })             │
│    callChatAPI(text, undefined, contexts)                                   │
│  }                                                                           │
│                                                                              │
│  callChatAPI(question, pageOverride, contexts) {                            │
│    // Construir claims                                                      │
│    if (contexts && contexts.length > 0) {                                   │
│      const objects = contexts.map(ctx => ({                                 │
│        type: ctx.type,                                                      │
│        identifier: ctx.identifier                                           │
│      }));                                                                    │
│      claims = { ...claims, objects }                                        │
│    }                                                                         │
│                                                                              │
│    // Intent detection                                                      │
│    const effectiveIntent = isFromQuickAction ? payloadIntent : "free_mode"  │
│                                                                              │
│    // Enviar payload                                                        │
│    fetch(apiEndpoint, {                                                     │
│      method: "POST",                                                        │
│      body: JSON.stringify({                                                 │
│        message: question,                                                   │
│        role: finalRole,                                                     │
│        session_id: sessionId,                                               │
│        source: payloadSource,                                               │
│        intent: effectiveIntent,                                             │
│        user: {                                                              │
│          ...userPayload,                                                    │
│          claims: { ...claims, objects }                                     │
│        }                                                                     │
│      })                                                                      │
│    })                                                                        │
│  }                                                                           │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     │ POST Request
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND API                                       │
│                                                                              │
│  Payload recibido:                                                          │
│  {                                                                           │
│    "message": "¿Cuántos alumnos tiene este curso?",                        │
│    "intent": "free_mode",                                                   │
│    "role": "tms:coordinador",                                               │
│    "session_id": "uuid-123",                                                │
│    "source": "chat_input",                                                  │
│    "user": {                                                                │
│      "claims": {                                                            │
│        "objects": [                                                         │
│          { "type": "curso", "identifier": "R-ADM-101" },                   │
│          { "type": "comercializacion", "identifier": "150" }               │
│        ]                                                                    │
│      }                                                                      │
│    }                                                                         │
│  }                                                                           │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────┐        │
│  │  RAG PROCESSING                                                 │        │
│  │                                                                  │        │
│  │  1. Detectar intent: "free_mode"                               │        │
│  │  2. Parsear claims.objects                                      │        │
│  │  3. Buscar curso "R-ADM-101"                                    │        │
│  │  4. Buscar comercialización "150"                              │        │
│  │  5. Contextualizar búsqueda con objetos                        │        │
│  │  6. Generar respuesta enriquecida                              │        │
│  └────────────────────────────────────────────────────────────────┘        │
│                                                                              │
│  Response:                                                                   │
│  {                                                                           │
│    "answer": "El curso R-ADM-101 en la comercialización 150...",           │
│    "meta": {                                                                │
│      "trace": {                                                             │
│        "mode": "free",                                                      │
│        "search_strategy": "rag_with_context"                               │
│      }                                                                      │
│    }                                                                         │
│  }                                                                           │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     │ Response
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CapinChat.tsx                                    │
│                                                                              │
│  Recepción de respuesta:                                                    │
│  - Agregar mensaje asistente a estado                                       │
│  - Actualizar lastMeta con trace info                                       │
│  - Renderizar respuesta en UI                                               │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ChatInput.tsx                                      │
│                                                                              │
│  Post-envío:                                                                │
│  - setMessage("")       ← Limpia input                                      │
│  - setContexts([])      ← Limpia contextos                                  │
│                                                                              │
│  Estado final:                                                              │
│  ┌───────────────────────────────────────────────────────────────────┐     │
│  │  [+] ┌────────────────────────────────────────┐ [Enviar]         │     │
│  │      │                                        │                   │     │
│  │      └────────────────────────────────────────┘                   │     │
│  └───────────────────────────────────────────────────────────────────┘     │
│  (Listo para próximo mensaje)                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🎨 Estados de UI

### Estado 1: Sin Contextos
```
┌─────────────────────────────────────────────────────────────┐
│  ChatInput                                                   │
│                                                              │
│  [+] ┌───────────────────────────────────────┐ [Enviar]    │
│      │ Escribe tu consulta aquí...           │             │
│      └───────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

### Estado 2: Con 2 Contextos
```
┌─────────────────────────────────────────────────────────────┐
│  ChatInput                                                   │
│                                                              │
│  ┌──────────────────┐ ┌──────────────────┐                 │
│  │ 📖 R-ADM-101  × │ │ 🏢 150        × │                 │
│  └──────────────────┘ └──────────────────┘                 │
│                                                              │
│  [+] ┌───────────────────────────────────────┐ [Enviar]    │
│      │ ¿Cuántos alumnos tiene este curso?    │             │
│      └───────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

### Estado 3: Máximo (5 Contextos)
```
┌─────────────────────────────────────────────────────────────┐
│  ChatInput                                                   │
│                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ 📖 R-ADM-101×│ │ 🏢 150      ×│ │ 👤 1234567-8×│        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│  ┌──────────────┐ ┌──────────────┐                         │
│  │ 🎓 9876543-2×│ │ 📖 R-VEN-202×│                         │
│  └──────────────┘ └──────────────┘                         │
│                                                              │
│  [+]* ┌─────────────────────────────────────┐ [Enviar]     │
│  ↑    │ Consulta con 5 contextos...         │              │
│  Deshabilitado └─────────────────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

### Estado 4: Popover Abierto (Selección de Tipo)
```
┌─────────────────────────────────────────────────────────────┐
│  ChatInput                                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  [+]  ← Añadir contexto                              │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │                                                  │  │   │
│  │  │  Selecciona el tipo de contexto:                │  │   │
│  │  │                                                  │  │   │
│  │  │  ┌─────────────┐ ┌─────────────┐               │  │   │
│  │  │  │ 🏢          │ │ 📖          │               │  │   │
│  │  │  │ Comercializ.│ │ Curso       │               │  │   │
│  │  │  └─────────────┘ └─────────────┘               │  │   │
│  │  │                                                  │  │   │
│  │  │  ┌─────────────┐ ┌─────────────┐               │  │   │
│  │  │  │ 👤          │ │ 🎓          │               │  │   │
│  │  │  │ Relator     │ │ Alumno      │               │  │   │
│  │  │  └─────────────┘ └─────────────┘               │  │   │
│  │  │                                                  │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  [+] ┌───────────────────────────────────────┐ [Enviar]    │
│      │                                        │             │
│      └───────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

### Estado 5: Popover Abierto (Formulario)
```
┌─────────────────────────────────────────────────────────────┐
│  ChatInput                                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  [+]  ← Añadir contexto                              │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  ← Volver                                       │  │   │
│  │  │                                                  │  │   │
│  │  │  Tipo: 📖 Curso                                 │  │   │
│  │  │  Ej: R-ADM-101, S-VEN-205                       │  │   │
│  │  │                                                  │  │   │
│  │  │  ┌────────────────────────────────────────┐     │  │   │
│  │  │  │ R-ADM-101                              │     │  │   │
│  │  │  └────────────────────────────────────────┘     │  │   │
│  │  │                                                  │  │   │
│  │  │                               [Añadir]          │  │   │
│  │  │                                                  │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  [+] ┌───────────────────────────────────────┐ [Enviar]    │
│      │                                        │             │
│      └───────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Flujo de Datos Simplificado

```
Usuario       ContextMenu       ChatInput         CapinChat          Backend
  │                │                │                 │                 │
  │─── click + ────▶│                │                 │                 │
  │                │                │                 │                 │
  │◀── popover ────│                │                 │                 │
  │                │                │                 │                 │
  │─ select tipo ─▶│                │                 │                 │
  │                │                │                 │                 │
  │─ enter ID ────▶│                │                 │                 │
  │                │                │                 │                 │
  │                │── onAddContext ▶│                 │                 │
  │                │                │─ setContexts ──▶│                 │
  │                │                │                 │                 │
  │◀──────────────────── render card ────────────────│                 │
  │                │                │                 │                 │
  │────────────── type message ─────▶│                 │                 │
  │                │                │                 │                 │
  │────────────── press Enter ───────▶│                 │                 │
  │                │                │─ onSendMessage ─▶│                 │
  │                │                │                 │                 │
  │                │                │                 │─ callChatAPI ──▶│
  │                │                │                 │                 │
  │                │                │                 │                 │─ RAG
  │                │                │                 │                 │  + contexts
  │                │                │                 │◀─ response ─────│
  │                │                │                 │                 │
  │◀──────────────────── render assistant msg ───────│                 │
  │                │                │                 │                 │
  │                │                │◀ clear contexts ─                 │
  │                │                │                 │                 │
  │◀──────────────────── clean UI ───────────────────│                 │
```

## 🔑 Decisiones Clave

### 1. Límite de 5 Contextos
```
WHY: Balance entre flexibilidad y payload size
     Suficiente para casos comunes
     Evita sobrecarga de UI

VALIDATION: Frontend (botón disabled)
            Backend (validar array length)
```

### 2. Limpieza Automática
```
WHY: Evita confusión en mensajes subsecuentes
     Fuerza intención explícita
     Simplifica estado

WHEN: Después de handleSubmit() exitoso
HOW: setContexts([])
```

### 3. Solo TMS
```
WHY: Rol con mayor necesidad de contexto complejo
     Otros roles tienen flujos específicos
     Puede extenderse en el futuro

CHECK: showContextMenu={isTmsRole}
WHERE: CapinChat.tsx línea ~1450
```

### 4. Free Mode Automático
```
WHY: Simplifica lógica de intent detection
     Backend decide cómo procesar
     Consistencia con telemetría

RULE: source === "chat_input" → intent = "free_mode"
      source === "quick_action" → intent = <específico>
```

## 🎯 Puntos de Validación

### Frontend
```typescript
// 1. Máximo de contextos
if (contexts.length < 5) { /* add */ }

// 2. Input no vacío
if (message.trim()) { /* send */ }

// 3. Identificador no vacío
if (identifier.trim()) { /* add context */ }

// 4. Solo TMS
<ChatInput showContextMenu={isTmsRole} />
```

### Backend (Esperado)
```python
# 1. Validar claims.objects existe
if 'claims' in user and 'objects' in user['claims']:
    objects = user['claims']['objects']

# 2. Validar tipos permitidos
ALLOWED_TYPES = ["comercializacion", "curso", "relator", "alumno"]
for obj in objects:
    assert obj['type'] in ALLOWED_TYPES

# 3. Validar intent free_mode
if payload['intent'] == "free_mode":
    # Usar RAG con contextos

# 4. Validar máximo 5 objetos
assert len(objects) <= 5
```

---

**Diagrama Version**: 1.0  
**Last Updated**: 2024  
**Maintainer**: Sistema de Documentación Automática
