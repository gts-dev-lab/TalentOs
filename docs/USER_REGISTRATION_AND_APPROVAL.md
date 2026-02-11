# Sistema de Registro y Aprobación de Usuarios - TalentOS

## 📋 Resumen

TalentOS incluye un sistema completo de registro y aprobación de usuarios que permite:
- **Registro público** de nuevos usuarios
- **Aprobación manual** para roles de gestión
- **Activación automática** para roles básicos
- **Notificaciones** cuando se aprueba/rechaza una solicitud

---

## 🔄 Flujo Completo

### 1. Registro de Usuario

**Ruta:** `/register`

**Proceso:**
1. El usuario completa el formulario con:
   - Nombre completo
   - Email
   - Contraseña (mínimo 8 caracteres)
   - Rol deseado

2. El sistema valida:
   - Email único (no puede estar en uso)
   - Contraseña segura (mínimo 8 caracteres)
   - Rol válido

3. **Determinación del estado:**
   - **Roles que requieren aprobación:**
     - `Formador`
     - `Jefe de Formación`
     - `Gestor de RRHH`
     - `Administrador General`
   - **Roles con activación automática:**
     - `Trabajador`
     - `Personal Externo`

4. **Resultado:**
   - Si requiere aprobación → Redirige a `/pending-approval`
   - Si es automático → Redirige a `/login` con mensaje de éxito

---

### 2. Página de Aprobación Pendiente

**Ruta:** `/pending-approval`

**Contenido:**
- Mensaje informativo explicando que la cuenta está pendiente
- Botón para volver al login
- El usuario **NO puede iniciar sesión** hasta ser aprobado

---

### 3. Gestión de Usuarios Pendientes

**Ruta:** `/dashboard/users`

**Acceso:** Solo para roles:
- `Gestor de RRHH`
- `Jefe de Formación`
- `Administrador General`

**Funcionalidades:**

#### A. Sección de Solicitudes Pendientes
- **Ubicación:** Parte superior de la página
- **Diseño:** Card destacado con fondo ámbar
- **Información mostrada:**
  - Avatar y nombre del usuario
  - Email
  - Rol solicitado (badge)
  - Departamento (si aplica)
  - Fecha de registro
  - Contador de solicitudes pendientes

#### B. Acciones Disponibles

**Aprobar Usuario:**
- Click en botón "Aprobar" (verde)
- Confirmación mediante diálogo
- **Efectos:**
  - Estado cambia a `approved`
  - Se crea Learning Path si corresponde al rol
  - Se envía notificación al usuario
  - El usuario puede iniciar sesión inmediatamente

**Rechazar Usuario:**
- Click en botón "Rechazar" (rojo)
- Confirmación mediante diálogo
- **Efectos:**
  - El usuario es **eliminado permanentemente**
  - No se puede recuperar
  - No se envía notificación (opcional: implementar)

---

### 4. Gestión de Usuarios Activos

**Sección:** Tabla principal de usuarios

**Funcionalidades:**
- **Filtros:**
  - Por rol (múltiple selección)
  - Por departamento (múltiple selección)
- **Paginación:** 20 usuarios por página
- **Acciones por usuario:**
  - Ver perfil (`/dashboard/users/{id}`)
  - Editar usuario (`/dashboard/users/{id}/edit`)
  - Cambiar estado (Activo/Suspendido) - Switch
  - Eliminar usuario (solo si no es tu propia cuenta)

---

## 🔐 Seguridad y Validaciones

### Validaciones de Registro

1. **Email:**
   - Formato válido
   - Único en el sistema
   - No puede estar en uso

2. **Contraseña:**
   - Mínimo 8 caracteres
   - Hash con Argon2 antes de guardar

3. **Rol:**
   - Debe ser uno de los roles válidos
   - Se muestra advertencia si requiere aprobación

### Validaciones de Aprobación

1. **Permisos:**
   - Solo administradores pueden aprobar/rechazar
   - No puedes eliminar tu propia cuenta

2. **Estado:**
   - Usuarios con `pending_approval` no pueden iniciar sesión
   - Usuarios con `suspended` no pueden iniciar sesión
   - Solo usuarios con `approved` pueden acceder

---

## 📧 Notificaciones

### Cuando se Aprueba un Usuario

**Tipo:** `enrollment_approved`

**Mensaje:**
```
¡Tu cuenta ha sido aprobada! Ya puedes acceder a todas las funcionalidades de la plataforma.
```

**URL relacionada:** `/dashboard`

**Cuándo se envía:** Inmediatamente al aprobar

---

## 🎨 Interfaz de Usuario

### Página de Registro (`/register`)

**Características:**
- Formulario limpio y claro
- Validación en tiempo real
- Mensajes de ayuda contextuales
- Indicador visual si el rol requiere aprobación
- Opciones de OAuth (Google, GitLab) - opcional

### Página de Gestión (`/dashboard/users`)

**Características:**
- **Card destacado** para usuarios pendientes (fondo ámbar)
- **Tabla principal** para usuarios activos
- **Filtros avanzados** por rol y departamento
- **Paginación** para grandes volúmenes
- **Acciones rápidas** (aprobar/rechazar) en la sección de pendientes
- **Menú contextual** para cada usuario activo

---

## 🔧 Implementación Técnica

### Base de Datos

**Tabla:** `users`

**Campos relevantes:**
- `status`: `'pending_approval' | 'approved' | 'suspended'`
- `role`: Rol del usuario
- `email`: Email único
- `passwordHash`: Hash de la contraseña

### Funciones Clave

**Registro:**
```typescript
db.addUser({
  name: string,
  email: string,
  password: string,
  role: Role,
  department: Department
})
```

**Aprobación:**
```typescript
db.updateUserStatus(userId: string, 'approved')
```

**Rechazo:**
```typescript
db.deleteUser(userId: string)
```

---

## 📝 Roles y Permisos

### Roles que Requieren Aprobación

| Rol | Requiere Aprobación | Razón |
|-----|---------------------|-------|
| Formador | ✅ Sí | Acceso a crear/editar cursos |
| Jefe de Formación | ✅ Sí | Gestión completa de formación |
| Gestor de RRHH | ✅ Sí | Acceso a datos de empleados |
| Administrador General | ✅ Sí | Acceso completo al sistema |

### Roles con Activación Automática

| Rol | Activación | Razón |
|-----|------------|-------|
| Trabajador | ✅ Automática | Usuario básico, sin permisos especiales |
| Personal Externo | ✅ Automática | Usuario temporal, acceso limitado |

---

## 🚀 Mejoras Futuras

### Pendientes de Implementar

1. **Notificación de Rechazo:**
   - Enviar email cuando se rechaza una solicitud
   - Mensaje personalizado con razón del rechazo

2. **Historial de Aprobaciones:**
   - Registrar quién aprobó/rechazó
   - Timestamp de cada acción
   - Logs de auditoría

3. **Aprobación Masiva:**
   - Seleccionar múltiples usuarios
   - Aprobar/rechazar en lote

4. **Filtros Avanzados:**
   - Por fecha de registro
   - Por estado
   - Búsqueda por nombre/email

5. **Comentarios en Aprobación:**
   - Campo opcional para notas
   - Visible solo para administradores

---

## 📚 Archivos Relacionados

- **Registro:** `src/app/register/page.tsx`
- **Aprobación Pendiente:** `src/app/pending-approval/page.tsx`
- **Gestión de Usuarios:** `src/app/dashboard/users/page.tsx`
- **Lógica de BD:** `src/lib/db-providers/dexie.ts`
- **Tipos:** `src/lib/types.ts`
- **Datos Seed:** `src/lib/data.ts`

---

## ✅ Checklist de Verificación

- [x] Registro público funcional
- [x] Validación de email único
- [x] Validación de contraseña segura
- [x] Determinación automática de estado según rol
- [x] Página de aprobación pendiente
- [x] Interfaz de gestión para administradores
- [x] Aprobación de usuarios pendientes
- [x] Rechazo de usuarios pendientes
- [x] Notificación al aprobar
- [x] Filtros por rol y departamento
- [x] Paginación de usuarios
- [x] Validación de permisos
- [ ] Notificación al rechazar (pendiente)
- [ ] Historial de aprobaciones (pendiente)

---

**Última actualización:** Enero 2026
