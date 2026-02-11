# Plan de Migración TalentOS: Sistema de Tickets (JIRA-style)

Este documento recoge el plan de migración para transformar el LMS actual en una **plataforma SaaS multi-inquilino** escalable, segura y conforme a estándares internacionales (LTI 1.3, SCORM 2004, RGPD, OWASP ASVS).

**Relación con otros documentos:**
- **Estado de la migración:** [MIGRATION_STATUS.md](./MIGRATION_STATUS.md) — resumen ejecutivo del progreso (92% completado).
- **Auditoría y estándares:** [DATABASE_AUDIT_AND_STANDARDS.md](./DATABASE_AUDIT_AND_STANDARDS.md) — análisis del modelo actual y lineamientos de mejora.
- **Estructura actual de la BD:** [DATABASE_STRUCTURE_AND_TECH.md](./DATABASE_STRUCTURE_AND_TECH.md).

**Nota de stack:** El plan asume backend con PostgreSQL y, en los tickets, se menciona FastAPI como ejemplo. La aplicación actual es **Next.js + TypeScript + Dexie (IndexedDB)**. La migración puede implementarse con:
- **Opción A:** Backend en Python (FastAPI) + PostgreSQL; frontend Next.js consume APIs.
- **Opción B:** Next.js API Routes (o servidor Node) + PostgreSQL; RLS y middleware de tenant aplican igual. El “middleware de contexto de inquilino” (TT-102) sería middleware Next.js o un wrapper que inyecte `tenant_id` desde el JWT.

---

## Resumen del plan

| Métrica | Valor |
|--------|--------|
| **Total de tickets (Fase 1)** | 13 |
| **Total de tickets (Fase 2)** | 4 |
| **Story Points acumulados (Fase 1)** | 107 |
| **Story Points acumulados (Fase 2)** | 31 |
| **Enfoque** | Aislamiento de datos (RLS), UUID v4, LTI 1.3, SCORM 2004, auditoría RGPD. |

---

## Epics y tickets

### EPIC-TENANT — Aislamiento Multi-Tenant

| ID | Título | Descripción técnica concisa | Dependencias | SP | Priority | Criterios de aceptación |
|----|--------|-----------------------------|--------------|----|----------|-------------------------|
| **TT-101** | Implementación de PostgreSQL Row-Level Security (RLS) | Configurar políticas de RLS en PostgreSQL para filtrar datos automáticamente por `tenant_id` a nivel de base de datos. | — | 8 | **Critical** | • Columna `tenant_id` (UUID v4) obligatoria en todas las tablas compartidas.<br>• Políticas de RLS activas que impidan fugas de datos entre inquilinos.<br>• Usuario de la BD de la aplicación restringido para no saltarse el RLS. |
| **TT-102** | Middleware de Contexto de Inquilino | Desarrollar middleware (FastAPI o Next.js) para extraer el `tenant_id` del JWT y persistirlo en un `ContextVar` (o equivalente) para el ciclo de vida de la petición. | TT-101 | 5 | **Critical** | • Extracción exitosa del `tenant_id` desde el token JWT.<br>• Disponibilidad global del ID del inquilino en la capa de servicio.<br>• Rechazo de peticiones sin `tenant_id` válido (HTTP 401). |

### EPIC-SECURITY — Seguridad y UUIDs

| ID | Título | Descripción técnica concisa | Dependencias | SP | Priority | Criterios de aceptación |
|----|--------|-----------------------------|--------------|----|----------|-------------------------|
| **TT-103** | Estandarización de Identificadores a UUID v4 | Migrar todas las Primary y Foreign Keys de IDs secuenciales o predecibles a UUID versión 4 aleatorios para mitigar ataques IDOR. | TT-101 | 8 | **Critical** | • Todos los modelos actualizados a UUID v4.<br>• Los IDs externos son opacos y no predecibles.<br>• Integridad referencial verificada tras la migración. |
| **TT-104** | Cifrado de Datos PII en Reposo y Tránsito | Implementar cifrado AES-256 para información personal identificable (PII) y forzar TLS 1.3 para comunicaciones. | — | 13 | **High** | • Campos PII identificados y cifrados en la base de datos.<br>• Gestión de claves mediante Azure Key Vault o similar.<br>• Protocolo HTTPS mandatorio para todos los endpoints. |

### EPIC-LTI — Integración LTI 1.3

| ID | Título | Descripción técnica concisa | Dependencias | SP | Priority | Criterios de aceptación |
|----|--------|-----------------------------|--------------|----|----------|-------------------------|
| **TT-105** | Orquestador de Autenticación OIDC LTI 1.3 | Implementar el flujo de inicio de sesión iniciado por terceros (OpenID Connect) y autenticación mediante JWT firmados. | TT-102 | 13 | **High** | • Validación exitosa de tokens JWT según el estándar LTI 1.3.<br>• Soporte para intercambio de claves públicas vía JWKS.<br>• Handshake completo con plataformas externas (ej. Canvas). |
| **TT-106** | Manejo de LTI Resource Link Launch | Desarrollar el endpoint para procesar el `LtiResourceLinkRequest` y mapear el `resource_link_id` al curso local. | TT-105 | 8 | **Medium** | • Recepción de reclamos (claims) obligatorios del estándar LTI.<br>• Redirección segura al contenido de la lección específica.<br>• Creación automática de perfiles de usuario si se requiere (provisioning). |

### EPIC-SCORM — SCORM 2004 Compliance

| ID | Título | Descripción técnica concisa | Dependencias | SP | Priority | Criterios de aceptación |
|----|--------|-----------------------------|--------------|----|----------|-------------------------|
| **TT-107** | Implementación del Adaptador API SCORM (API_1484_11) | Crear el objeto DOM `API_1484_11` en el frontend para permitir la comunicación entre el SCO y el LMS. | — | 13 | **High** | • Objeto API detectable por contenidos externos.<br>• Soporte de métodos `Initialize` y `Terminate`.<br>• Manejo de estados de comunicación conforme al estándar. |
| **TT-108** | Persistencia del Modelo de Datos SCORM (CMI) | Desarrollar la lógica de backend para persistir elementos críticos como `cmi.completion_status` y `cmi.score.scaled`. | TT-107 | 8 | **Medium** | • Almacenamiento persistente del progreso del alumno.<br>• Soporte para transacciones de grupos de entidades (EGT) en tablas.<br>• Validación de tipos de datos según el SCORM Run-Time Environment. |

### EPIC-AUDIT — Auditoría y RGPD

| ID | Título | Descripción técnica concisa | Dependencias | SP | Priority | Criterios de aceptación |
|----|--------|-----------------------------|--------------|----|----------|-------------------------|
| **TT-109** | Sistema Centralizado de Logs de Auditoría | Implementar logs inmutables para eventos de seguridad (auth, cambios de acceso) con marcas de tiempo en UTC. | TT-102 | 5 | **High** | • Registro de todas las decisiones de autenticación y acceso.<br>• Logs sanitizados (sin contraseñas ni tokens).<br>• Atribución de cada entrada al `tenant_id` correspondiente. |
| **TT-110** | Módulo de Gestión de Derechos RGPD (ARCO) | Desarrollar funciones para la exportación de datos y borrado lógico (derecho al olvido) de la información del trabajador. | TT-101 | 5 | **Medium** | • Exportación de datos en formato legible por máquina.<br>• Implementación de *soft delete* que cumpla plazos legales de bloqueo.<br>• Notificación de supresión de datos a interesados. |

### EPIC-MIGRATION — Migración de Datos

| ID | Título | Descripción técnica concisa | Dependencias | SP | Priority | Criterios de aceptación |
|----|--------|-----------------------------|--------------|----|----------|-------------------------|
| **TT-111** | Script de Extracción y Carga: IndexedDB → PostgreSQL | Crear herramienta para migrar datos desde los clientes locales (single-tenant) a la base de datos centralizada multi-tenant. | TT-103 | 13 | **High** | • Mapeo correcto de registros antiguos a nuevos esquemas UUID.<br>• Asignación masiva de `tenant_id` durante la carga.<br>• Cero pérdida de historial de lecciones y progreso. |

### DOCUMENTACIÓN

| ID | Título | Descripción técnica concisa | Dependencias | SP | Priority | Criterios de aceptación |
|----|--------|-----------------------------|--------------|----|----------|-------------------------|
| **TT-112** | Guía de Arquitectura Multi-Tenant y Seguridad | Documentar la nueva estructura de capas, fronteras de confianza y flujos de datos según OWASP ASVS. | — | 3 | **Low** | • Diagramas de arquitectura actualizados.<br>• Guía de seguridad para desarrolladores (Shift-Left).<br>• Documentación de la lógica de aislamiento de inquilinos. |

### VALIDACIÓN / QA

| ID | Título | Descripción técnica concisa | Dependencias | SP | Priority | Criterios de aceptación |
|----|--------|-----------------------------|--------------|----|----------|-------------------------|
| **TT-113** | Validación de Seguridad y Aislamiento de Datos | Ejecutar pruebas de penetración híbridas y escaneos de vulnerabilidades (OWASP ZAP/Snyk) para verificar el aislamiento. | Todos | 8 | **High** | • Informe de vulnerabilidades corregidas (XSS, SQLi, IDOR).<br>• Verificación exitosa de que el Inquilino A no ve datos del Inquilino B.<br>• Cumplimiento verificado de los controles Nivel 1 de ASVS. |

### EPIC-POSTGRESQL — Integración Real con Base de Datos (Fase 2)

| ID | Título | Descripción técnica concisa | Dependencias | SP | Priority | Criterios de aceptación |
|----|--------|-----------------------------|--------------|----|----------|-------------------------|
| **TT-114** | Provider PostgreSQL para DBProvider | Implementar `postgresProvider` en `src/lib/db-providers/postgres.ts` que implemente la interfaz `DBProvider` usando conexiones PostgreSQL (pg o similar). Cada método debe ejecutar `SET app.current_tenant_id = getCurrentTenantId()` antes de queries. | TT-101, TT-102 | 13 | **High** | • Provider completo con todos los métodos de DBProvider.<br>• Conexión a PostgreSQL con pool de conexiones.<br>• Filtrado automático por tenant_id usando RLS (no filtros manuales en queries).<br>• Selección de provider vía `DB_PROVIDER=postgres` en env. |
| **TT-115** | Integración de SET app.current_tenant_id en API Routes | Modificar las API Routes (`/api/*`) para que, cuando `DB_PROVIDER=postgres`, ejecuten `SET app.current_tenant_id = '<uuid>'` al inicio de cada handler usando `getCurrentTenantId()` del contexto de tenant. | TT-114 | 5 | **High** | • Middleware o wrapper que establece la variable de sesión antes de queries.<br>• Todas las rutas protegidas establecen el tenant correctamente.<br>• RLS funciona automáticamente sin filtros manuales en SQL. |
| **TT-116** | Migración de Auditoría a PostgreSQL | Migrar el almacén de logs de auditoría (`src/lib/audit/`) de memoria a tabla PostgreSQL `audit_logs` (crear migración si falta). Mantener compatibilidad con consultas por tenant. | TT-114 | 5 | **Medium** | • Tabla `audit_logs` en PostgreSQL con índices por tenant_id y timestamp.<br>• Funciones de auditoría escriben en PostgreSQL.<br>• `getAuditLogsByTenant` consulta desde PostgreSQL. |
| **TT-117** | Tests de Integración PostgreSQL + RLS | Crear tests (Jest o similar) que verifiquen el aislamiento multi-tenant con PostgreSQL real: conexión, SET app.current_tenant_id, queries filtradas por RLS, imposibilidad de acceso entre inquilinos. | TT-114, TT-115 | 8 | **High** | • Tests con PostgreSQL en Docker (testcontainers o similar).<br>• Verificación de que queries sin SET devuelven 0 filas.<br>• Verificación de que queries con SET devuelven solo datos del tenant correcto. |

---

## Estado de implementación

| Ticket | Estado | Notas |
|--------|--------|--------|
| **TT-101** | ✅ Hecho (esquema + RLS) | Migraciones SQL en `migrations/`: extensión pgcrypto, tabla `tenants`, rol `talentos_app` (sin BYPASSRLS), esquema con todas las tablas compartidas con `tenant_id` (UUID) y PKs UUID/serial. Políticas RLS que filtran por `app.current_tenant_id()`. La app debe hacer `SET app.current_tenant_id = '<uuid>'` por request (TT-102). Docker opcional: `docker-compose.postgres.yml`. |
| **TT-102** | ✅ Hecho | JWT incluye `tenantId` (UUID) en el payload. Login asigna `tenantId` desde `user.tenantId` o env `TENANT_ID_DEFAULT` (fallback UUID por defecto). Middleware en `src/middleware.ts`: rutas `/api/*` (excepto login/session/logout/nextauth) exigen token válido con `tenantId`; 401 si falta. Contexto de inquilino: `src/lib/tenant-context.ts` con AsyncLocalStorage, `getSessionFromRequest()`, `runWithTenant` / `requireTenant()` y `getCurrentTenantId()` para la capa de servicio. Para PostgreSQL: en cada request, hacer `SET app.current_tenant_id = getCurrentTenantId()` antes de queries (cuando se use backend con RLS). |
| **TT-103** | ✅ Hecho (capa Dexie) | Utilidad `src/lib/uuid.ts` (UUID v4). Todos los IDs generados en Dexie para nuevas entidades (users, courses, certificates, PDI, regulations, compliance, audits, reviews) usan `uuid()`. Datos seed (`user_1`, `course_1`, …) se mantienen para demo; nuevos registros son opacos y no predecibles. |
| **TT-104** | ✅ Hecho | Catálogo PII y helpers en `src/lib/pii-encryption.ts` (encryptPii/decryptPii usando AES vía `src/lib/auth/encryption.ts`; AES-256 con ENCRYPTION_SECRET ≥32 bytes). Documentación en ARCHITECTURE_MULTITENANT_AND_SECURITY.md: Key Vault (Azure/AWS/GCP/Vault) para ENCRYPTION_SECRET en producción, HTTPS obligatorio y TLS 1.3 recomendado. |
| **TT-109** | ✅ Hecho | Sistema de auditoría en `src/lib/audit/`: tipos (AuditLogEntry, AuditEventKind), logger con timestamps UTC (ISO 8601), almacén en memoria (sustituible por PostgreSQL). Eventos: auth.login.success, auth.login.failure, auth.logout; detalles sanitizados (sin contraseñas ni tokens). Login y logout registran con tenantId y userId. getAuditLogsByTenant(tenantId) para consultas por inquilino. |
| **TT-110** | ✅ Hecho | ARCO/RGPD en `src/lib/gdpr.ts`: tipo User con `deletedAt` (soft delete). `exportUserData(userId)` devuelve JSON legible por máquina (perfil, matriculaciones, progreso, certificados, notificaciones, foro, formaciones externas, rutas de aprendizaje, insignias, PDI, cumplimiento normativo, valoraciones). `requestErasure(userId, { notify })` hace soft delete (softDeleteUser) y opcionalmente notifica por email. Dexie: getAllUsers/getUserById/login/getLoggedInUser excluyen usuarios con deletedAt; nuevo softDeleteUser. Constante SOFT_DELETE_RETENTION_DAYS (30) para plazos legales. |
| **TT-112** | ✅ Hecho | Guía en `docs/ARCHITECTURE_MULTITENANT_AND_SECURITY.md`: diagramas de capas y flujo de petición (ASCII + Mermaid), fronteras de confianza, documentación de la lógica de aislamiento por tenant (JWT, middleware, contexto, RLS). Guía Shift-Left para desarrolladores con checklist OWASP (auth, multi-tenant, validación, auditoría, despliegue). Referencia rápida de código (tenant-context, audit, gdpr, migraciones). |
| **TT-105** | ✅ Hecho | Orquestador OIDC LTI 1.3 en `src/lib/lti/`: tipos (LtiOidcLoginParams, LtiIdTokenPayload), config por env (LTI_ISSUER, LTI_AUTH_REQUEST_URL, LTI_JWKS_URI, LTI_CLIENT_ID, LTI_TENANT_ID). Verificación de id_token con JWKS remoto (jose.createRemoteJWKSet). GET `/api/lti/oidc/login` (login initiation) y POST `/api/lti/oidc/callback` (callback con state JWT y sesión TalentOS). Rutas `/api/lti` públicas en middleware. Handshake completo: redirect a plataforma → callback con id_token → verificación JWKS → cookie de sesión → redirect a target_link_uri. |
| **TT-106** | ✅ Hecho | Resource Link Launch en callback OIDC: si el id_token incluye `resource_link.id`, se resuelve el curso con `getCourseIdByResourceLinkId` (mapeo desde env `LTI_RESOURCE_LINK_MAP`, JSON). Redirección segura a `/dashboard/courses/[courseId]`. Módulo `src/lib/lti/resource-link.ts` con getLaunchRedirectUrl. Documentación en LTI_13_SETUP.md. |
| **TT-107** | ✅ Hecho | Adaptador API SCORM 2004 en `src/lib/scorm-api.ts`: createScormApi(), installScormApi(), uninstallScormApi(), findScormApi(). Objeto API_1484_11 (y alias API) con Initialize(""), Terminate(""), GetValue(), SetValue(), Commit(""), GetLastError(), GetErrorString(), GetDiagnostic(). Estados: Not Initialized, Initialized, Terminated. CMI: completion_status, success_status, score.scaled, location, suspend_data, etc. findAPI instalado en window para detección por el SCO. Integrado en scorm-player; onTerminate con snapshot CMI para marcar curso completado. |
| **TT-108** | ✅ Hecho | Persistencia CMI en `src/lib/scorm-cmi.ts` y Dexie: tipo ScormCmiState (completionStatus, successStatus, scoreScaled, location, suspendData). Tabla scormCmiState (v46), getScormCmiState(userId, courseId), saveScormCmiState(userId, courseId, data). Validación RTE: score 0–1, location ≤1000, valores completion/success según estándar. cmiToScormCmiState / scormCmiStateToCmi para convertir. scorm-player: carga CMI al iniciar (initialCmi), onCommit persiste con saveScormCmiState. |
| **TT-111** | ✅ Hecho | Exportación: `src/lib/export-for-migration.ts` (exportAllDataForMigration) obtiene de Dexie users, courses, enrollments, userProgress, notifications, certificates, certificateTemplates, forumMessages, externalTrainings, costs, costCategories, badges, userBadges, learningPaths, userLearningPathProgress, courseRatings, individualDevelopmentPlans, regulations, regulationCompliance, complianceAudits, scormCmiState (sin Blobs, sin usuarios deletedAt). Botón "Exportar para migración PostgreSQL" en Datos y privacidad. Script Node `scripts/migrate-indexeddb-to-postgres.mjs`: lee JSON, mapea IDs antiguos a UUID, asigna tenant_id, inserta en PostgreSQL (users, courses, enrollments, user_progress, notifications, certificate_templates/certificates, scorm_cmi_state). Uso: node scripts/migrate-indexeddb-to-postgres.mjs &lt;export.json&gt; &lt;tenant_uuid&gt; [DATABASE_URL]. Ver scripts/README_MIGRATION_TT111.md. |
| **TT-113** | 📋 Checklist + tests | Runbook en `docs/TT113_SECURITY_QA_CHECKLIST.md`. Tests automatizados en `src/__tests__/middleware.security.test.ts` (401 sin token / token inválido / sin tenantId; rutas públicas permitidas). Scripts: `npm run audit`, `npm run test:security`. Ejecución de ZAP, Snyk y pruebas manuales de aislamiento pendiente; al completar, rellenar informe y marcar hecho. |

### Fase 2: Integración PostgreSQL

| Ticket | Estado | Notas |
|--------|--------|--------|
| **TT-114** | 🚧 En progreso (~40%) | Provider PostgreSQL: estructura base (`src/lib/db-providers/postgres.ts`), pool de conexiones, helpers `queryWithTenant`/`queryOne`/`queryScalar` que establecen `SET app.current_tenant_id`. Métodos implementados: Auth (login, logout, getLoggedInUser), User (CRUD completo), Course (CRUD completo), Enrollment (request, get, update, getEnrolledCourses, getIncompleteMandatory), UserProgress (get, getAll, markModuleAsCompleted), SCORM CMI (getScormCmiState, saveScormCmiState). Tabla `scorm_cmi_state` añadida a migración 002 y políticas RLS en 003. Integrado en `db-providers/index.ts` con carga condicional (solo servidor). Dependencias: `pg` y `@types/pg`. Pendiente: implementar métodos restantes (~60%): Certificates, Forum, Notifications, Resources, Announcements, Chat, Calendar, ExternalTraining, Costs, Badges, AI, LearningPaths, PDI, Ratings, Permissions, Logs, Regulations/Compliance. |
| **TT-115** | ✅ Hecho | Wrapper `withTenant(handler)` en `src/lib/api-with-tenant.ts`: envuelve handlers de API para ejecutarlos dentro de `runWithTenant()`, de modo que `getCurrentTenantId()` esté disponible y el provider PostgreSQL establezca `SET app.current_tenant_id` en cada conexión. Uso: `export const GET = withTenant(async (req) => { ... });`. Helper `isPostgresProvider()` para comprobar si es obligatorio. Documentar en rutas que usen BD con DB_PROVIDER=postgres. |
| **TT-116** | ✅ Hecho | Tabla `audit_logs` en `002_schema_talentos.sql` con índices; RLS en `003_rls_policies.sql`. Módulo `src/lib/audit/`: tipos, `memory-store`, `postgres-store` (pg con SET app.current_tenant_id), `logAudit()` y `getAuditLogsByTenant()` según DB_PROVIDER/DATABASE_URL. |
| **TT-117** | ⏳ Pendiente | Tests de Integración PostgreSQL + RLS |

---

## Orden sugerido de implementación (por dependencias)

1. **TT-101** (RLS) → **TT-102** (Middleware tenant)  
2. **TT-103** (UUID v4) — puede solaparse con diseño de esquema de TT-101  
3. **TT-104** (Cifrado PII) en paralelo cuando el esquema esté definido  
4. **TT-105** (OIDC LTI) → **TT-106** (Resource Link Launch)  
5. **TT-107** (API SCORM) → **TT-108** (Persistencia CMI)  
6. **TT-109** (Logs auditoría) tras TT-102  
7. **TT-110** (ARCO/RGPD) tras TT-101  
8. **TT-111** (Migración IndexedDB → PostgreSQL) tras TT-103  
9. **TT-112** (Documentación) en paralelo  
10. **TT-113** (QA/Seguridad) al cierre de los epics críticos  

---

## Referencia a estándares

| Estándar | Tickets relacionados |
|----------|----------------------|
| **OWASP ASVS** | TT-101, TT-103, TT-104, TT-109, TT-113 |
| **LTI 1.3** | TT-105, TT-106 |
| **SCORM 2004** | TT-107, TT-108 |
| **RGPD (ARCO, derecho al olvido)** | TT-110, TT-109 |
