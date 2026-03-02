# Listado de todos los tickets / issues — TalentOS

Referencia única de **todos los tickets** del plan de migración y de producción.  
Detalle completo en: [MIGRATION_PLAN_TICKETS.md](./MIGRATION_PLAN_TICKETS.md) y [PRODUCTION_TICKETS.md](./PRODUCTION_TICKETS.md).

---

## Resumen de conteo

| Origen                     | Cantidad | IDs                 |
| -------------------------- | -------- | ------------------- |
| **Plan de migración (TT)** | 17       | TT-101 … TT-117     |
| **Producción (PROD)**      | 17       | PROD-101 … PROD-117 |
| **Total**                  | **34**   | —                   |

_(Si esperabas 27, puede ser un subconjunto o otro origen; aquí están los 34 documentados.)_

---

## 1. Plan de migración (TT-101 a TT-117) — 17 tickets

| #   | ID         | Título                                     | Estado               |
| --- | ---------- | ------------------------------------------ | -------------------- |
| 1   | **TT-101** | PostgreSQL Row-Level Security (RLS)        | ✅ Hecho             |
| 2   | **TT-102** | Middleware de contexto de inquilino        | ✅ Hecho             |
| 3   | **TT-103** | Identificadores UUID v4                    | ✅ Hecho             |
| 4   | **TT-104** | Cifrado PII en reposo y tránsito           | ✅ Hecho             |
| 5   | **TT-105** | Orquestador OIDC LTI 1.3                   | ✅ Hecho             |
| 6   | **TT-106** | LTI Resource Link Launch                   | ✅ Hecho             |
| 7   | **TT-107** | Adaptador API SCORM (API_1484_11)          | ✅ Hecho             |
| 8   | **TT-108** | Persistencia CMI SCORM                     | ✅ Hecho             |
| 9   | **TT-109** | Logs de auditoría centralizados            | ✅ Hecho             |
| 10  | **TT-110** | RGPD / ARCO / derecho al olvido            | ✅ Hecho             |
| 11  | **TT-111** | Script IndexedDB → PostgreSQL              | ✅ Hecho             |
| 12  | **TT-112** | Guía arquitectura multi-tenant y seguridad | ✅ Hecho             |
| 13  | **TT-113** | Validación seguridad y aislamiento         | 📋 Checklist + tests |
| 14  | **TT-114** | Provider PostgreSQL (DBProvider)           | ✅ Completado        |
| 15  | **TT-115** | SET app.current_tenant_id en API Routes    | ✅ Hecho             |
| 16  | **TT-116** | Migración auditoría a PostgreSQL           | ✅ Hecho             |
| 17  | **TT-117** | Tests integración PostgreSQL + RLS         | 🚧 En progreso       |

---

## 2. Producción (PROD-101 a PROD-117) — 17 tickets

| #   | ID           | Título                                    | Prioridad | Estado       |
| --- | ------------ | ----------------------------------------- | --------- | ------------ |
| 1   | **PROD-101** | Completar TT-113 (validación seguridad)   | Critical  | ⏳ Pendiente |
| 2   | **PROD-102** | Completar TT-114 (Provider PostgreSQL)    | Critical  | ⏳ Pendiente |
| 3   | **PROD-103** | Completar TT-117 (tests PostgreSQL + RLS) | Critical  | ⏳ Pendiente |
| 4   | **PROD-104** | Envolver API Routes con withTenant        | High      | ⏳ Pendiente |
| 5   | **PROD-105** | Documentación API (OpenAPI/Swagger)       | High      | ⏳ Pendiente |
| 6   | **PROD-106** | Tests unitarios componentes UI            | High      | ⏳ Pendiente |
| 7   | **PROD-107** | Tests E2E flujos de negocio               | High      | ⏳ Pendiente |
| 8   | **PROD-108** | Tests de carga y rendimiento              | Medium    | ⏳ Pendiente |
| 9   | **PROD-109** | Transiciones de estados Enrollment        | Medium    | ⏳ Pendiente |
| 10  | **PROD-110** | Automatizaciones PDI (notificaciones)     | Medium    | ⏳ Pendiente |
| 11  | **PROD-111** | Dashboard vencimientos Compliance         | Medium    | ⏳ Pendiente |
| 12  | **PROD-112** | Configuración entornos (Dev/Staging/Prod) | High      | ⏳ Pendiente |
| 13  | **PROD-113** | CI/CD Pipeline                            | High      | ⏳ Pendiente |
| 14  | **PROD-114** | Monitoreo y logging en producción         | Medium    | ⏳ Pendiente |
| 15  | **PROD-115** | Manual de usuario final                   | Low       | ⏳ Pendiente |
| 16  | **PROD-116** | Runbook de operaciones                    | Low       | ⏳ Pendiente |
| 17  | **PROD-117** | Guía onboarding nuevos inquilinos         | Low       | ⏳ Pendiente |

---

## Dónde ver el detalle

- **Migración (TT-XXX):** [docs/MIGRATION_PLAN_TICKETS.md](./MIGRATION_PLAN_TICKETS.md) — descripción, criterios de aceptación, estado.
- **Estado migración:** [docs/MIGRATION_STATUS.md](./MIGRATION_STATUS.md) — resumen ejecutivo (92% completado).
- **Producción (PROD-XXX):** [docs/PRODUCTION_TICKETS.md](./PRODUCTION_TICKETS.md) — descripción, SP, prioridad, estado.
- **Tareas pendientes (resumen):** [README_TODO.md](../README_TODO.md) — prioridad alta/media e ideas futuras.

---

**Última actualización:** generado a partir de la documentación existente en el repo.
