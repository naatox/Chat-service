# CapinIA Frontend - Gestión de Sesiones RAG

## Funcionalidades Implementadas

### 1. Cambio de Sesión (Session Reset)

#### Componentes Modificados:
- `src/hooks/useSessionId.ts` - Hook para gestión de session_id
- `src/components/CapinChat.tsx` - Integración del manejo de sesiones
- `src/components/ChatHeader.tsx` - Botón de cambiar sesión

#### Funcionalidad:
- **Botón "Cambiar sesión"** (icono RotateCcw) en el header del chat
- Genera un nuevo `session_id` usando `crypto.randomUUID()`
- Guarda el session_id en `localStorage` con clave `rag_session_id`
- Limpia el historial visual del chat (frontend)
- NO borra el historial del backend
- Muestra toast informativo: "Sesión cambiada: [session_id]... Los próximos 8 mensajes usarán contexto limpio"
- Deshabilita controles por 200ms para evitar dobles envíos

### 2. Payload de API Mejorado

#### Estructura del Request:
```json
{
  "message": "hola",
  "role": "tms:logística",           // Preserva subroles exactos
  "session_id": "<uuid>",            // Session ID en payload principal
  "user": {
    "sub": "",
    "role": "tms:logística",         // Role exacto (sin colapsar subroles)
    "session_id": "<uuid>",          // También en user payload
    "tenantId": "insecap",
    "claims": { ... },               // Si aplica
    "filters": { ... }               // Si aplica (paginación)
  }
}
```

#### Logging para Debug:
```
Chat request received - role: tms:logística, raw_role: tms:logística, session_id: <uuid>, message: hola mundo...
```

## Cómo Debuggear

### 1. Frontend (React)

#### Verificar Session ID:
```javascript
// En DevTools Console
localStorage.getItem('rag_session_id')
// Debería mostrar: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

#### Logs de Request:
- Abrir DevTools → Network → filtrar por "chat"
- Hacer un request y verificar el payload JSON
- Buscar `session_id` en el body del request

#### Logs en Console:
```
Chat request received - role: tms:logística, raw_role: undefined, session_id: abc123..., message: dame el curso...
```

### 2. Backend (Esperado)

#### Logs que el Backend debería mostrar:
```
[API] Chat request received - role: tms:logística, raw_role: tms:logística, message: dame el curso ES-COM-1352
[SESSION] Loading max 8 conversation turns for session: abc123...
[LOOKUP] point-read card:curso:1352 hit/miss
[LOOKUP] by sourceId hit/miss  
[HYBRID] fts=50, vec=100, fused=80
[RERANK] boosts applied: {codigoCurso, sourceId, contains_code}
```

#### Endpoint de Diagnóstico (A implementar):
```
GET /diag/retrieval_audit?session_id=<uuid>
```

Retorna:
```json
{
  "session_id": "<uuid>",
  "resolved_role": "tms:logística",
  "filters": { "page": 1, "page_size": 10 },
  "top_k": 50,
  "last_query": "dame el curso ES-COM-1352",
  "conversation_turns": 8,
  "citations": [
    { "id": "card:curso:1352", "title": "Curso Excel Básico", "url": null }
  ],
  "context_sent_to_llm": "..."
}
```

### 3. Tests Manuales

#### Test 1: Cambio de Sesión
1. Abrir chat, enviar mensaje "hola"
2. Click en botón cambiar sesión (icono RotateCcw)
3. ✅ Ver toast: "Sesión cambiada: abc12345... Los próximos 8 mensajes usarán contexto limpio"
4. ✅ Chat se limpia visualmente
5. ✅ Nuevo session_id en localStorage
6. ✅ Próximo mensaje usa nuevo session_id

#### Test 2: Preservación de Subroles TMS
1. Seleccionar rol "TMS" → área "Logística"
2. Enviar mensaje "test"
3. ✅ DevTools Network: `"role": "tms:logística"`
4. ✅ Console log: `role: tms:logística, raw_role: tms:logística`

#### Test 3: Lookup Determinista de Curso (Backend)
1. Enviar "dame el curso ES-COM-1352"
2. ✅ Backend log: `[LOOKUP] point-read card:curso:1352 hit`
3. ✅ Respuesta incluye info exacta del curso sin depender de vector search

## Estructura de Archivos

```
src/
├── hooks/
│   ├── useSessionId.ts           # 🆕 Gestión de session_id con localStorage
│   └── use-toast.ts              # Existente (toast notifications)
├── components/
│   ├── CapinChat.tsx             # ✅ Integra hook de sesiones + logging
│   ├── ChatHeader.tsx            # ✅ Botón "Cambiar sesión" 
│   └── ui/                       # shadcn/ui components
└── lib/
    └── chatStorage.ts            # Existente (persistencia de mensajes)
```

## Próximos Pasos (Backend RAG)

El frontend está listo. Ahora implementar en el backend:

1. **Unificar endpoint `/api/chat`** - Un solo handler que tome `req.user.role` prioritario
2. **Policy tms:*** - No bloquear mensajes sensibles para roles tms:*
3. **Lookup determinista** - Point read por código de curso antes de vector search
4. **Ventana de 8 turns** - Cargar máximo 8 mensajes previos por sesión
5. **Paginación por sesión** - Estado persistente por session_id + rol
6. **Detección robusta de códigos** - Regex `\\b[A-Z]{2}-[A-Z]{3}-\\d{3,6}\\b`
7. **Endpoint diagnóstico** - `GET /diag/retrieval_audit` para debug

## Comandos Útiles

```bash
# Compilar frontend
npm run build

# Modo desarrollo
npm run dev

# Ver logs en tiempo real (DevTools Console)
# Buscar: "Chat request received"
```