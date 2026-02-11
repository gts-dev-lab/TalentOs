# Optimizaciones de Rendimiento - TalentOS

**Última actualización:** 21 de enero de 2026

---

## 🚀 Optimizaciones Implementadas

### 1. Next.js Config

- ✅ **Compresión GZIP** habilitada (`compress: true`)
- ✅ **SWC Minify** para minificación más rápida
- ✅ **Optimización de imágenes** (AVIF, WebP)
- ✅ **Cache de imágenes** (TTL: 60s)
- ✅ **Optimización de imports** para librerías grandes

### 2. Carga Inicial y Percepción de Velocidad

- ✅ **loading.tsx** en `/dashboard`: skeleton mientras se carga cualquier ruta del dashboard
- ✅ **loading.tsx** en raíz: placeholder mínimo en carga inicial
- ✅ **DashboardLoadingSkeleton**: skeleton que imita sidebar + topbar + contenido (layout visible de inmediato)
- ✅ **Auth en paralelo**: las peticiones a `/api/auth/session` y NextAuth se hacen con `Promise.all` en lugar de en serie
- ✅ **Fuente Inter** con `display: 'swap'`: el texto se muestra al instante con fuente del sistema y se cambia a Inter cuando carga
- ✅ **Code splitting** automático de Next.js por rutas
- ✅ **WebAssembly** optimizado para argon2-browser

---

## 📊 Tiempos Esperados

### Desarrollo (npm run dev)
- **Primera carga:** ~2-3 segundos (compilación inicial)
- **Hot reload:** ~1-2 segundos
- **Navegación:** <500ms

### Producción (npm run build && npm start)
- **Primera carga:** ~1-2 segundos
- **Navegación:** <300ms
- **API responses:** <200ms

---

## 🔧 Optimizaciones Adicionales Recomendadas

### 1. Lazy Loading de Componentes

Para componentes grandes que no se usan inmediatamente:

```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false, // Si no necesita SSR
});
```

### 2. Optimización de Queries Dexie

```typescript
// ❌ Mal: Carga todos los datos
const allUsers = await db.getAllUsers();

// ✅ Bien: Carga solo lo necesario con límite
const users = await db.users.limit(20).toArray();
```

### 3. Memoización de Cálculos Pesados

```typescript
import { useMemo } from 'react';

const expensiveValue = useMemo(() => {
  // Cálculo pesado
  return heavyCalculation(data);
}, [data]);
```

### 4. Virtualización de Listas Largas

Para tablas con muchos elementos:

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

// Renderiza solo los elementos visibles
```

---

## 🐛 Si Sigue Lento

### Verificar:

1. **Consola del navegador:**
   - Abre DevTools (F12)
   - Ve a Network tab
   - Verifica qué recursos tardan más

2. **Base de datos:**
   - Verifica tamaño de IndexedDB
   - Limpia datos antiguos si es necesario

3. **Dependencias:**
   - Verifica que no hay múltiples instancias de React
   - Revisa bundle size: `npm run build` y revisa `.next/analyze`

### Soluciones Rápidas:

```bash
# Limpiar cache de Next.js
rm -rf .next

# Limpiar node_modules y reinstalar
rm -rf node_modules
npm install --legacy-peer-deps

# Rebuild
npm run build
```

---

## 📈 Monitoreo de Rendimiento

### En Desarrollo:

```bash
# Ver bundle size
npm run build
# Revisa el output para ver tamaños de bundles
```

### En Producción:

- Usa Lighthouse (Chrome DevTools)
- Revisa Core Web Vitals
- Monitorea tiempos de respuesta de API

---

## ✅ Checklist de Optimización

- [x] Compresión GZIP habilitada
- [x] SWC Minify activado
- [x] Optimización de imágenes
- [x] Code splitting automático
- [ ] Lazy loading de componentes pesados (pendiente)
- [ ] Virtualización de listas largas (pendiente)
- [ ] Service Worker para cache (opcional)

---

**Nota:** La primera carga siempre será más lenta debido a la compilación inicial. Las cargas subsecuentes deberían ser mucho más rápidas gracias al cache del navegador y de Next.js.
