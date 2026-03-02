# Guía Rápida - Look & Feel Frappe HRMS

## ✅ Implementación Completa

TalentOS ahora tiene el look & feel completo de **Frappe HRMS** sin cambiar ninguna lógica funcional.

---

## 🎨 Cambios Visuales Principales

### 1. **Sidebar Oscuro** (Estilo Frappe)

- Fondo oscuro profesional
- Texto claro
- Hover suave
- Estado activo con azul translúcido
- Colapsable en desktop
- Drawer en móvil

### 2. **Topbar Claro**

- Fondo blanco/claro
- Border sutil
- Shadow ligero
- Altura compacta (56px)

### 3. **Componentes Estilo Frappe**

- **Cards**: Sombras sutiles, bordes redondeados (6px)
- **Botones**: Bordes redondeados (4px), sombras en primary
- **Tablas**: Header con fondo, bordes sutiles, hover suave
- **Inputs**: Bordes redondeados, focus mejorado
- **Modales**: Overlay con blur, sombras grandes

### 4. **Transiciones Suaves**

- Fade entre páginas (300ms)
- Hover con transiciones rápidas (150ms)
- Animaciones consistentes

---

## 📱 PWA Funcional

### Instalación en Escritorio

1. Abre TalentOS en Chrome/Edge
2. Click en el icono de instalación en la barra de direcciones
3. O ve a Configuración → Instalar TalentOS

### Características PWA

- ✅ Icono en escritorio
- ✅ Funciona offline (recursos estáticos cacheados)
- ✅ Atajos: Dashboard, Cursos
- ✅ Tema color: #2E9AFE

---

## 🎯 Páginas Ejemplo

### Dashboard

- Grid de StatCards (4 columnas)
- Cards con hover suave
- Layout responsive

### Empleados (`/dashboard/users`)

- Tabla estilo Frappe
- Filtros y paginación
- Badges de estado

### Nómina (`/dashboard/nomina`) ✨ NUEVO

- Página ejemplo completa
- StatCards de resumen
- Tabla con datos mock
- Solo UI - sin lógica funcional

---

## 🔧 Clases CSS Disponibles

### Utilidades Frappe

```css
.frappe-sidebar      /* Sidebar oscuro */
.frappe-topbar       /* Topbar claro */
.frappe-card         /* Card con shadow */
.frappe-page         /* Padding de página */
.frappe-skeleton     /* Skeleton mejorado */
.frappe-interactive  /* Transiciones suaves */
```

### Tailwind Utilities

```css
shadow-frappe-sm     /* Sombra pequeña */
shadow-frappe        /* Sombra estándar */
shadow-frappe-md     /* Sombra media */
shadow-frappe-lg     /* Sombra grande */

rounded-frappe-sm    /* Radio 4px */
rounded-frappe       /* Radio 6px */
rounded-frappe-lg    /* Radio 8px */

duration-frappe-fast /* 150ms */
duration-frappe      /* 200ms */
duration-frappe-slow /* 300ms */
```

---

## 📊 Design Tokens

**Archivo**: `src/styles/design-tokens.css`

Todos los tokens están disponibles como variables CSS:

- `--frappe-sidebar-bg`
- `--frappe-primary`
- `--frappe-shadow`
- `--frappe-radius-md`
- etc.

---

## 🚀 Verificación Rápida

### 1. Sidebar Oscuro

```
✅ Abre /dashboard
✅ Sidebar debe tener fondo oscuro
✅ Texto debe ser claro
✅ Hover debe cambiar fondo
```

### 2. Topbar Claro

```
✅ Header debe tener fondo claro
✅ Border bottom sutil
✅ Shadow ligero
```

### 3. Cards

```
✅ Cards deben tener sombra sutil
✅ Bordes redondeados (6px)
✅ Hover debe aumentar sombra
```

### 4. Tablas

```
✅ Header con fondo gris claro
✅ Bordes sutiles entre filas
✅ Hover suave en filas
```

### 5. PWA

```
✅ Abre DevTools → Application → Service Workers
✅ Debe estar registrado "talentos-v1"
✅ Manifest debe estar cargado
```

---

## 🐛 Troubleshooting

### Service Worker no se registra

1. Verifica que `public/sw.js` existe
2. Abre DevTools → Application → Service Workers
3. Click "Unregister" si hay uno antiguo
4. Recarga la página

### Estilos no se aplican

1. Verifica que `src/styles/design-tokens.css` existe
2. Verifica que `globals.css` importa design-tokens
3. Limpia cache del navegador (Ctrl+Shift+R)

### Sidebar no es oscuro

1. Verifica que `frappe-sidebar` está en el `<aside>`
2. Verifica que design-tokens están cargados
3. Revisa DevTools → Elements → Computed styles

---

## 📚 Documentación Completa

Ver `docs/FRAPPE_UI_IMPLEMENTATION.md` para detalles técnicos completos.

---

**Estado**: ✅ Completado y listo para usar  
**Última actualización**: 25 de enero de 2026
