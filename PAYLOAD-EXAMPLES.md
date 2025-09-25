# Ejemplos de Payloads - CapinIA RAG Frontend

## 1. Payload Típico - Role TMS con Subrol

### Request Frontend → Backend:
```json
{
  "message": "dame el curso ES-COM-1352",
  "role": "tms:logística",
  "session_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "user": {
    "sub": "",
    "role": "tms:logística",
    "session_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479", 
    "tenantId": "insecap"
  }
}
```

### Console Log Esperado (Frontend):
```
Chat request received - role: tms:logística, raw_role: undefined, session_id: f47ac10b-58cc-4372-a567-0e02b2c3d479, message: dame el curso ES-COM-1352
```

### Backend Log Esperado (A implementar):
```
[API] Chat request received - role: tms:logística, raw_role: tms:logística, session_id: f47ac10b-58cc-4372-a567-0e02b2c3d479, message: dame el curso ES-COM-1352
[SESSION] Loading max 8 conversation turns for session: f47ac10b-58cc-4372-a567-0e02b2c3d479
[LOOKUP] Detected course code: ES-COM-1352 -> num: 1352
[LOOKUP] point-read card:curso:1352 by id/pk -> HIT
[LOOKUP] get_entity_by_pk(curso:1352) -> FOUND  
[RESPONSE] Including both card + entity in context
[POLICY] role=tms:logística -> no credential filtering applied
```

---

## 2. Payload Cliente con Paginación

### Request Frontend → Backend:
```json
{
  "message": "siguiente página",
  "role": "cliente", 
  "session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "user": {
    "sub": "",
    "role": "cliente",
    "session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "tenantId": "insecap",
    "claims": {
      "rut": "12.345.678-9",
      "idCliente": "CLI-001234", 
      "correo": "cliente@empresa.cl"
    },
    "filters": {
      "page": 2,
      "page_size": 10
    }
  }
}
```

### Backend Log Esperado:
```
[API] Chat request received - role: cliente, raw_role: cliente, session_id: a1b2c3d4-e5f6-7890-abcd-ef1234567890, message: siguiente página
[SESSION] Loading max 8 conversation turns for session: a1b2c3d4-e5f6-7890-abcd-ef1234567890  
[PAGINATION] Detected page command: siguiente -> page=2, page_size=10
[SESSION] Updating pagination state for session+role: cliente
[RESPONSE] page=2, page_size=10, total=150, total_pages=15, returned=10
```

---

## 3. Payload Alumno/Relator con RUT

### Request Frontend → Backend:
```json
{
  "message": "mis cursos pendientes",
  "role": "alumno",
  "session_id": "12345678-abcd-ef01-2345-678901234567", 
  "user": {
    "sub": "",
    "role": "alumno",
    "session_id": "12345678-abcd-ef01-2345-678901234567",
    "tenantId": "insecap",
    "claims": {
      "rut": "11.222.333-4"
    }
  }
}
```

---

## 4. Payload Público (Sin Claims)

### Request Frontend → Backend:
```json
{
  "message": "qué cursos tienen disponibles",
  "role": "publico",
  "session_id": "98765432-1234-5678-9abc-def012345678",
  "user": {
    "sub": "",
    "role": "publico", 
    "session_id": "98765432-1234-5678-9abc-def012345678",
    "tenantId": "insecap"
  }
}
```

---

## 5. Response Esperado del Backend

### Estructura de Response:
```json
{
  "answer": "El curso ES-COM-1352 'Técnicas de Análisis de Datos con Excel Nivel Básico'...",
  "citations": [
    {
      "id": "card:curso:1352",
      "title": "Técnicas de Análisis de Datos con Excel Nivel Básico", 
      "url": null
    },
    {
      "id": "kb_curso:1352", 
      "title": "ES-COM-1352 - Información Detallada",
      "url": null
    }
  ],
  "session_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "meta": {
    "total_cursos": null,
    "page": null, 
    "page_size": null,
    "returned": 2,
    "latency_ms": 1250
  },
  "usage": {
    "prompt_tokens": 2450,
    "completion_tokens": 180,
    "total_tokens": 2630
  }
}
```

---

## 6. Comandos de Debugging

### Frontend (DevTools Console):
```javascript
// Ver session_id actual
localStorage.getItem('rag_session_id')

// Cambiar session_id manualmente
localStorage.setItem('rag_session_id', 'test-session-123')

// Ver el último payload enviado (en Network tab → chat request)
// Verificar JSON body del POST

// Generar nuevo UUID
crypto.randomUUID()
```

### Backend (Logs a implementar):
```bash
# Filtrar logs de session específica
grep "session: f47ac10b-58cc" app.log

# Ver todos los lookups de curso
grep "\[LOOKUP\]" app.log

# Ver política aplicada por rol
grep "\[POLICY\]" app.log | grep "tms:"
```

---

## Cambios Clave Implementados ✅

1. **Hook `useSessionId`**: Genera, persiste y gestiona session_id con localStorage
2. **Botón cambiar sesión**: UI integrada en ChatHeader con toast informativo  
3. **Payload mejorado**: session_id en payload principal + user payload
4. **Preservación de subroles**: `tms:logística` no se colapsa a `tms`
5. **Logging para debug**: Console logs con role, raw_role, session_id, message
6. **Deshabilitar controles**: 200ms tras reset para evitar dobles envíos
7. **Tests manuales**: HTML interactivo para verificar funcionalidad

## Próximos Pasos (Backend) 🔄

El frontend está **completo y funcional**. Ahora implementar en el servicio RAG backend:

- Unificar `/api/chat` handler
- Policy `tms:*` para no filtrar credenciales  
- Lookup determinista por código curso
- Ventana de 8 conversación turns
- Paginación persistente por sesión
- Endpoint `/diag/retrieval_audit` para debugging