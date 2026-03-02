# Progreso del plan de transformación – TalentOS

Documento para retomar el trabajo. Última actualización: **21 ene 2026**.

---

## ✅ Completado

### FASE 1: Fundamentos de seguridad

- **DÍA 1: Eliminar passwords en texto plano**
  - Argon2 (servidor) + argon2-browser (cliente)
  - `User.passwordHash` en lugar de `password`
  - Migración de contraseñas legacy en primer login
  - `src/lib/auth/password.ts`, `src/lib/auth/encryption.ts`

### FASE 1: Certificaciones

- Módulo de certificados: tipos, Dexie, plantillas, emisión al completar curso
  - UI: listado, detalle, descarga PDF, verificación pública
  - Rutas: `/dashboard/certificates`, `/certificates/verify`

### DÍA 4: Arreglar sistema de sincronización

- `isSynced`: `.equals('false')` → `.equals(false)` (boolean)
  - En `supabase-sync.ts` y `getUnsyncedItemsCount`
- `getUnsyncedItemsCount`: lista fija de tablas con `isSynced` (users, courses, enrollments, userProgress, costs, certificateTemplates, certificates)
- Índice `isSynced`: Dexie **v42** en enrollments, userProgress, costs, certificates, certificateTemplates
- Reintentos en sync: hasta 3 intentos con backoff (1s, 2s) al fallar upsert a Supabase

### DÍA 5: Habilitar validaciones de build

- `next.config`: `ignoreBuildErrors: false`, `ignoreDuringBuilds: false`
- Fix TS: `api-settings.tsx` — "Project Settings > API" → `&gt;` (evitar JSX)
- ESLint: `eslint-config-next`, `.eslintrc.json` (next/core-web-vitals)

### DÍA 2: JWT + sesiones seguras ✓

- `src/lib/auth/jwt.ts`: `signSessionToken`, `verifySessionToken`, `isJwtConfigured` (jose, HS256, JWT_SECRET ≥ 32 chars)
- API: `POST /api/auth/login`, `GET /api/auth/session`, `POST /api/auth/logout`
- Cookie `auth-token` httpOnly, secure en prod, sameSite lax, 7 días
- Login API verifica contra `users` de `src/lib/data.ts` + `verifyPassword`
- Auth context: intenta `/api/auth/session` → fallback `getLoggedInUser` (Dexie); login intenta API → fallback Dexie (503/red)
- Logout: llama `/api/auth/logout` y `db.logout`
- `jose` en `package.json`; `JWT_SECRET` documentado en `SETUP_GUIDE.md`

### DÍA 3: Gestión segura de secretos ✓

- Eliminado guardado de API keys en cookies (deprecated)
- Prioridad: env vars → cookies (solo lectura, con warnings de deprecación)
- UI actualizada: `api-settings.tsx` y `ai-settings.tsx` muestran variables de entorno necesarias
- `saveApiKeysAction` rechaza guardado y muestra mensaje de migración
- `saveAIConfigAction` solo guarda modelo activo (no API keys)
- Warnings en consola cuando se usan cookies (compatibilidad temporal)

### NextAuth + Authentik SSO (empresarial) ✓

- **NextAuth** con basePath `/api/nextauth` (no conflictúa con `/api/auth/*`)
- **Authentik** como proveedor OIDC cuando `AUTHENTIK_ISSUER`, `AUTHENTIK_ID`, `AUTHENTIK_SECRET` y `NEXT_PUBLIC_AUTHENTIK_ENABLED` están configurados
- Login: email/contraseña (actual) + opción **Cuenta empresarial (Google / Microsoft)** vía Authentik
- AuthProvider unificado: sesión JWT (nuestro API) + sesión NextAuth (SSO); logout limpia ambos
- Cuentas demo: clic en usuario rellena email **y** contraseña (`password123`)
- Docs: `AUTHENTIK_SETUP.md`, `AUTHENTIK_QUICKSTART.md`, `authentik.env.example`, `docker-compose.authentik.yml`

---

## ⏳ Pendiente (orden sugerido)

### Verificaciones finales (Pruebas en navegador)

1. ✅ **JWT_SECRET configurado** - `.env.local` con JWT_SECRET, NEXTAUTH_URL, NEXTAUTH_SECRET
2. ✅ **Menú hamburguesa implementado** - Responsive, animado, funcional
3. ✅ **Página de cursos corregida** - Paginación, filtros y búsqueda funcionando
4. ⏳ **Probar autenticación:** Login con cuenta demo (clic en usuario → Iniciar sesión) o `elena.vargas@example.com` / `password123`
5. ⏳ **Probar SSO (opcional):** Configurar Authentik, habilitar `NEXT_PUBLIC_AUTHENTIK_ENABLED`, probar **Cuenta empresarial**
6. ⏳ **Probar PDI:** Crear un Plan de Desarrollo Individual de prueba
7. ⏳ **Probar Compliance:** Registrar una normativa y verificar cumplimiento
8. ⏳ **Probar Backups:** Exportar e importar un backup
9. ⏳ **Revisar Monitoreo:** Verificar métricas en Settings > Backups y Mantenimiento
10. ⏳ **Flujo completo E2E:** Curso → Inscripción → Completar → Certificar

**📖 Guía de pruebas**: Ver `docs/TESTING_GUIDE.md` para instrucciones detalladas paso a paso

### Plan original (auditoría)

- **DÍA 1-5:** Completados ✓
- **FASE 1-4:** Completadas ✓
- **Firebase:** Eliminado (enero 2026) - Reemplazado por Web Notifications API nativa

### Paginación en listados ✓ (Día 15, FASE 4)

- Componente `Pagination` reutilizable (`src/components/ui/pagination.tsx`)
- Paginación aplicada a:
  - **Usuarios** (20 por página) - con filtros de rol/departamento
  - **Cursos** (12 por página) - con filtros de modalidad y búsqueda
  - **Certificados** (15 por página)
  - **Planes de Carrera** (15 por página)
  - **Inscripciones** (20 por página) - con filtros de estado y búsqueda
- Reset a página 1 al cambiar filtros/búsqueda
- Scroll automático al cambiar de página
- Contador "Mostrando X - Y de Z"

### Plan 4 fases (Certificaciones, PDI, etc.)

- **PDI** – Planes de Desarrollo Individual ✓ (FASE 2)
- **Compliance y normativas** ✓ (FASE 3) - Completo
  - Tipos: `Regulation`, `RegulationCompliance`, `ComplianceAudit`
  - Esquema Dexie v44: tablas `regulations`, `regulationCompliance`, `complianceAudits`
  - CRUD completo para normativas, cumplimiento y auditorías
  - UI: Listado con filtros, crear normativa, detalle con cumplimiento por usuario
  - Dashboard de cumplimiento con métricas y tabla por normativa
  - Sistema de alertas: `compliance-alerts.ts` con verificación de vencimientos y notificaciones automáticas
  - Página de detalle de normativa con tabs (cumplimiento, cursos, auditorías)
  - Registro de cumplimiento por usuario con cálculo automático de vencimientos
- **Optimización BD, backups, monitoreo** ✓ (FASE 4) - Completo
  - Sistema de backups: `backup-service.ts` con export/import de base de datos completa
  - UI de gestión de backups: `BackupManager` en Settings con exportar, importar y estadísticas
  - Limpieza automática de datos antiguos (notificaciones 90 días, logs INFO 180 días, logs IA 365 días)
  - Estadísticas de BD: conteo de registros por tabla, tamaño estimado
  - Exclusión de datos sensibles en backups (passwordHash, fcmToken)
  - **Optimización de índices**: Dexie v45 con índices compuestos para consultas frecuentes
    - Índices en: `[instructor+status]`, `[status+role]`, `[department+status]`, `[courseId+status]`, `[userId+isRead]`, etc.
  - **Sistema de monitoreo**: `db-monitoring.ts` con métricas completas
    - Métricas de actividad (24h, 7d, 30d)
    - Tasa de errores
    - Conteo de elementos sin sincronizar
    - Estado de salud de la BD (healthy/warning/critical)
    - Recomendaciones automáticas
  - Panel de monitoreo integrado en BackupManager con alertas visuales

---

## Archivos relevantes tocados recientemente

| Área             | Archivos                                                                                                                                                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| JWT + API auth   | `src/lib/auth/jwt.ts`, `src/app/api/auth/login/route.ts`, `session/route.ts`, `logout/route.ts`                                                                                                                                                   |
| Auth contexto    | `src/contexts/auth.tsx`                                                                                                                                                                                                                           |
| Sync             | `src/lib/supabase-sync.ts`, `src/lib/db-providers/dexie.ts`                                                                                                                                                                                       |
| Build/lint       | `next.config.ts`, `src/components/settings/api-settings.tsx`, `.eslintrc.json`, `package.json`                                                                                                                                                    |
| Secretos (DÍA 3) | `src/app/dashboard/settings/actions.ts`, `src/lib/notification-service.tsx`, `src/ai/provider.ts`, `src/components/settings/api-settings.tsx`, `src/components/settings/ai-settings.tsx`                                                          |
| Paginación       | `src/components/ui/pagination.tsx`, `src/app/dashboard/users/page.tsx`, `src/app/dashboard/courses/page.tsx`, `src/app/dashboard/certificates/page.tsx`, `src/app/dashboard/learning-paths/page.tsx`, `src/components/enrollments/admin-view.tsx` |
| PDI              | `src/lib/types.ts` (tipos), `src/lib/db-providers/dexie.ts` (v43, CRUD), `src/app/dashboard/pdi/page.tsx`, `new/page.tsx`, `[id]/page.tsx`, `[id]/edit/page.tsx`, `src/lib/nav.ts`                                                                |
| Compliance       | `src/lib/types.ts` (Regulation, RegulationCompliance, ComplianceAudit), `src/lib/db-providers/dexie.ts` (v44, CRUD), `src/app/dashboard/compliance/page.tsx`, `new/page.tsx`, `src/lib/nav.ts`                                                    |
| Backups          | `src/lib/backup-service.ts`, `src/components/settings/backup-manager.tsx`, `src/app/dashboard/settings/page.tsx`                                                                                                                                  |
| Monitoreo        | `src/lib/db-monitoring.ts`, `src/lib/db-providers/dexie.ts` (v45 índices optimizados)                                                                                                                                                             |
| Docs             | `docs/SETUP_GUIDE.md` (JWT_SECRET), `docs/PLAN_PROGRESS.md` (este archivo)                                                                                                                                                                        |

---

## Cómo retomar

1. Abrir `docs/PLAN_PROGRESS.md` (este archivo).
2. Ejecutar `npm install` y revisar que no falle.
3. Configurar variables de entorno en `.env.local`:
   - `JWT_SECRET` (≥ 32 caracteres) para login por API
   - `GOOGLE_API_KEY`, `OPENAI_API_KEY` para IA
   - `SUPABASE_SERVICE_ROLE_KEY`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, etc. según necesidades
4. Probar login (API vs Dexie) y build/lint.
5. Continuar con el siguiente ítem del plan (Paginación, PDI, Compliance, etc.).
