# Changelog - TalentOS

## [Enero 2026] - Última actualización

### 🔥 Cambios importantes

#### Firebase eliminado
- **Motivo**: Eliminar dependencias innecesarias y simplificar la arquitectura
- **Reemplazo**: Web Notifications API nativa del navegador
- **Archivos eliminados**:
  - `src/lib/firebase-client.ts`
  - `public/firebase-messaging-sw.js`
  - Dependencia `firebase` y 53 paquetes relacionados
- **Archivos actualizados**:
  - `src/lib/notification-service.tsx` - funciones de push simplificadas
  - `src/components/settings/push-notification-settings.tsx` - usa API nativa
  - `src/components/settings/api-settings.tsx` - sección de Firebase eliminada
  - `src/app/dashboard/settings/actions.ts` - `saveFcmTokenAction` eliminada
  - `src/lib/types.ts` - `fcmToken` marcado como deprecated
  - `package.json` - dependencia eliminada
- **Impacto**: Las notificaciones push ahora funcionan solo cuando la aplicación está abierta, usando la API nativa del navegador

### ✅ Completado

#### FASE 4: Optimización BD, backups, monitoreo (Enero 2026)
- Sistema de backups completo (export/import JSON)
- Limpieza automática de datos antiguos
- Monitoreo de base de datos con métricas en tiempo real
- Estado de salud de la BD con recomendaciones
- Optimización de índices Dexie v45
- Panel de gestión integrado en Settings

#### FASE 3: Compliance y normativas (Enero 2026)
- CRUD completo de normativas
- Seguimiento de cumplimiento por usuario
- Sistema de vencimientos y alertas
- Dashboard de cumplimiento
- Auditorías de cumplimiento

#### FASE 2: PDI - Planes de Desarrollo Individual (Enero 2026)
- CRUD completo de PDIs
- Objetivos, cursos, hitos y revisiones
- Gestión por roles (managers)
- Estados: Draft, Active, Completed, Archived
- Vista detallada con tabs

#### FASE 1: Seguridad (Enero 2026)
- Certificaciones (generación, verificación, plantillas)
- JWT + sesiones seguras
- Hashing de contraseñas con argon2
- Gestión segura de secretos (env vars)
- Sincronización mejorada
- Validaciones de build habilitadas

### 📊 Paginación
- Componente reutilizable aplicado en:
  - Usuarios (20/página)
  - Cursos (12/página)
  - Certificados (15/página)
  - Planes de Carrera (15/página)
  - Inscripciones (20/página)

### 🔧 Correcciones técnicas

#### Service Workers
- Eliminados service workers problemáticos de Firebase
- PWA simplificada sin interferencia en desarrollo
- Sin errores de "Failed to convert value to 'Response'"

#### WebAssembly
- Configuración mejorada para argon2-browser
- Soporte de .wasm en webpack
- `serverExternalPackages` para evitar bundling en servidor

### 📝 Documentación
- `CHANGELOG.md` creado
- `FEATURES_SUMMARY.md` actualizado
- `PLAN_PROGRESS.md` actualizado
- Referencias a Firebase eliminadas

---

## Versiones anteriores

### [Diciembre 2025 - Enero 2026] - Desarrollo inicial
- Implementación de funcionalidades core
- Sistema LMS offline-first
- Integración con IA (Genkit)
- Gamificación
- Chat y calendario
- Análisis y reportes

---

### 🚀 Setup inicial simplificado
- `.env.local` creado automáticamente con JWT_SECRET generado
- Variables de entorno completamente documentadas
- Todas las configuraciones son opcionales excepto JWT_SECRET
- App funciona 100% offline sin configuración adicional

---

**Última actualización**: 24 de enero de 2026
