# Feature: Relator Quick Action

## 🎯 Descripción

Quick Action "Relator" visible únicamente para el rol `tms:logistica`, que permite buscar información de relatores por RUT o nombre mediante modal con tabs y envía payloads deterministas al backend.

## 📋 Componentes Implementados

### 1. **RelatorQuickAction.tsx**
- Botón "Relator" con icono `UserSearch`
- Visible solo para `tms:logistica`
- Abre modal de búsqueda al hacer click

### 2. **RelatorSearchModal.tsx**
- Modal con dos tabs: "Por RUT" y "Por Nombre"
- Validación de RUT con formato automático
- Telemetría de eventos `tms_find_relator_click`
- Envío de payloads deterministas

### 3. **RelatorResult.tsx**
- Renderiza resultados como card individual o lista clicable
- Parsea automáticamente datos estructurados
- Chips clicables para re-buscar por RUT específico

### 4. **ActionsRegistry.tsx**
- Sistema de registro no intrusivo para nuevas acciones
- Filtrado por roles para mostrar acciones relevantes

### 5. **AdditionalTmsActions.tsx**
- Contenedor de acciones adicionales por composición
- Integración no intrusiva con TmsQuickActions existente

## 🔧 Integración

### Payload Determinista
```json
{
  "source": "quick_action",
  "intent": "tms.find_relator", 
  "message": "Relator search",
  "role": "tms:logistica",
  "session_id": "uuid...",
  "tenantId": "insecap",
  "target": { 
    "rut": "12.345.678-9" // o "nombre": "Juan Pérez"
  }
}
```

### Respuestas del Backend

**Card individual:**
```
Nombre: Juan Pérez González
RUT: 12.345.678-9
Email: juan.perez@email.com
Teléfono: +56912345678
```

**Lista múltiple:**
```
Encontré 3 coincidencias:

Juan Pérez González — 12.345.678-9
María García López — 98.765.432-1  
Carlos Rodríguez Silva — 11.222.333-4
```

## 🎨 UX Features

- **Formato automático de RUT**: `12345678-9` → `12.345.678-9`
- **Validación en tiempo real**: Botones habilitados solo con input válido
- **Chips clicables**: Re-búsqueda automática al seleccionar de lista
- **Telemetría**: Tracking de método usado (rut/nombre)
- **Error handling**: Toasts no bloqueantes para errores

## 🔒 Restricciones de Acceso

- **Visible solo para**: `tms:logistica`
- **Registry pattern**: Otras acciones pueden agregarse sin modificar código existente
- **No intrusivo**: Acciones TMS originales (R11/R12/R61/Bloques) inalteradas

## 🧪 Testing

### Casos de prueba implementados:
- ✅ Renderizado del botón solo para roles TMS
- ✅ Envío de payload correcto (source, intent, target)
- ✅ Chips re-disparan payload con RUT seleccionado
- ✅ Parsing de resultados estructurados vs no estructurados

### Para probar manualmente:
1. Cambiar rol a `tms` → subrol `logistica`
2. Verificar que aparece botón "Relator" en Quick Actions
3. Hacer búsqueda por RUT: `12345678-9`
4. Hacer búsqueda por nombre: `Juan Pérez`
5. Verificar payloads en DevTools → Network

## 📁 Estructura de archivos

```
src/features/tms/
├── RelatorQuickAction.tsx      # Botón principal
├── RelatorSearchModal.tsx      # Modal con tabs
├── RelatorResult.tsx           # Renderizado de resultados
├── RelatorResultWrapper.tsx    # Wrapper con detección
├── AdditionalTmsActions.tsx    # Contenedor por composición  
├── ActionsRegistry.tsx         # Sistema de registro
├── useRelatorSearch.ts         # Hook para lógica
├── index.ts                    # Exportaciones
└── __tests__/
    ├── RelatorQuickAction.test.tsx
    └── RelatorResult.test.tsx
```

## 🔄 Flujo de datos

1. **Click en "Relator"** → Abre modal
2. **Submit en tab** → Construye payload con `target: {rut|nombre}`
3. **Envío al API** → `POST /api/chat` con payload determinista  
4. **Respuesta del backend** → Detecta si es card o lista
5. **Renderizado** → Card con datos o chips clicables
6. **Click en chip** → Re-envío con RUT específico

## ✨ Extensibilidad

El sistema de `ActionsRegistry` permite agregar nuevas Quick Actions sin modificar código existente:

```tsx
// Registrar nueva acción
actionsRegistry.register({
  id: "nueva-accion",
  component: <NuevaAccion onActionSend={handler} />,
  roles: ["tms:comercial"],
  order: 2
});
```

La feature está completamente implementada siguiendo el patrón ADD-ONLY/EXTEND-ONLY especificado.