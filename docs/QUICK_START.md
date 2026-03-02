# Guía Rápida - Probar TalentOS

## 🚀 Inicio Rápido

### 1. Verificar que el servidor está corriendo

El servidor de desarrollo debería estar iniciándose. Verifica en tu terminal que veas:

```
✓ Ready in X seconds
○ Local: http://localhost:3000
```

### 2. Abrir la aplicación

Abre tu navegador y ve a: **http://localhost:3000**

---

## 🔑 Credenciales de Prueba

### Usuario Administrador

- **Email**: `elena.vargas@example.com`
- **Password**: `password123`

### Otros usuarios disponibles

Revisa `src/lib/data.ts` para ver todos los usuarios de prueba con el mismo password.

---

## ✅ Funcionalidades para Probar

### 1. Autenticación

- ✅ Login con JWT (si `JWT_SECRET` está configurado)
- ✅ Fallback a Dexie si no hay JWT
- ✅ Sesión persistente

### 2. Certificados

- **Ruta**: `/dashboard/certificates`
- ✅ Ver certificados con paginación
- ✅ Verificar certificados públicamente

### 3. PDI (Planes de Desarrollo Individual)

- **Ruta**: `/dashboard/pdi`
- ✅ Ver listado de PDIs
- ✅ Crear nuevo PDI (como manager/admin)
- ✅ Ver detalle de PDI con tabs
- ✅ Añadir revisiones y marcar hitos

### 4. Compliance y Normativas

- **Ruta**: `/dashboard/compliance`
- ✅ Ver normativas activas
- ✅ Crear nueva normativa
- ✅ Ver cumplimiento por usuario
- ✅ Registrar cumplimiento
- ✅ Ver alertas de vencimiento

### 5. Backups y Monitoreo

- **Ruta**: `/dashboard/settings` > Tab "Backups y Mantenimiento"
- ✅ Ver estadísticas de la BD
- ✅ Exportar backup
- ✅ Ver métricas de actividad
- ✅ Ver estado de salud de la BD
- ✅ Ejecutar limpieza de datos antiguos

### 6. Paginación

Prueba la paginación en:

- `/dashboard/users` (20 por página)
- `/dashboard/courses` (12 por página)
- `/dashboard/certificates` (15 por página)
- `/dashboard/learning-paths` (15 por página)
- `/dashboard/enrollments` (20 por página)

---

## 🧪 Casos de Prueba Sugeridos

### Caso 1: Crear un PDI

1. Login como administrador
2. Ir a `/dashboard/pdi`
3. Click en "Crear PDI"
4. Seleccionar un empleado
5. Añadir objetivos, cursos, fechas
6. Guardar y ver el detalle

### Caso 2: Registrar una Normativa

1. Login como administrador
2. Ir a `/dashboard/compliance`
3. Click en "Nueva Normativa"
4. Completar el formulario
5. Asociar cursos y roles
6. Guardar y ver el cumplimiento

### Caso 3: Exportar Backup

1. Login como administrador
2. Ir a `/dashboard/settings`
3. Tab "Backups y Mantenimiento"
4. Ver estadísticas
5. Click en "Exportar Backup"
6. Descargar el archivo JSON

### Caso 4: Ver Monitoreo

1. Login como administrador
2. Ir a `/dashboard/settings` > "Backups y Mantenimiento"
3. Revisar:
   - Estado de salud de la BD
   - Métricas de actividad
   - Elementos sin sincronizar
   - Recomendaciones

---

## ⚠️ Solución de Problemas

### El servidor no inicia

```bash
# Verificar que no hay otro proceso en el puerto 3000
lsof -ti:3000 | xargs kill -9

# Reinstalar dependencias si es necesario
rm -rf node_modules package-lock.json
npm install

# Intentar de nuevo
npm run dev
```

### Error de JWT

Si ves errores relacionados con JWT:

- Crea `.env.local` con `JWT_SECRET` (mínimo 32 caracteres)
- O simplemente no lo configures y usará autenticación local

### Error de base de datos

Si hay problemas con IndexedDB:

- Abre DevTools (F12)
- Application > Storage > IndexedDB
- Elimina la base de datos "TalentOSDB"
- Recarga la página

---

## 📊 Verificar Funcionalidades

### Checklist de Verificación

- [ ] Login funciona correctamente
- [ ] Dashboard carga sin errores
- [ ] PDI: Puedo crear y ver PDIs
- [ ] Compliance: Puedo crear normativas
- [ ] Backups: Puedo exportar backup
- [ ] Monitoreo: Veo métricas y estado de salud
- [ ] Paginación: Funciona en todos los listados
- [ ] Certificados: Veo el listado con paginación

---

## 🔍 Inspeccionar en DevTools

### Ver la Base de Datos

1. Abre DevTools (F12)
2. Ve a **Application** > **Storage** > **IndexedDB**
3. Expande **TalentOSDB**
4. Explora las tablas y sus datos

### Ver Logs del Sistema

1. Login como administrador
2. Ve a `/dashboard/logs`
3. Revisa los logs del sistema

### Verificar Autenticación

1. DevTools > Application > Cookies
2. Busca `auth-token` (si JWT está configurado)
3. O verifica `localStorage` para `loggedInUserId`

---

## 📝 Notas

- La aplicación funciona **100% offline** - no necesitas backend
- Los datos se guardan en IndexedDB del navegador
- Para sincronizar con Supabase, configura las variables de entorno
- Todos los datos de prueba están en `src/lib/data.ts`

---

**¡Disfruta probando TalentOS!** 🎉
