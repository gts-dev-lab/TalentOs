# Arquitectura de TalentOS

Documento de referencia para entender la arquitectura actual, la prevista, el modelo de dominio real y la separación entre artefactos de planificación (tickets TT-XXX) y entidades de negocio.

---

## Arquitectura actual

### Diagrama de capas (texto)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CLIENTE (navegador)                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────────────────────┐│
│  │ Next.js      │  │ Dexie        │  │ Auth (cookie auth-token, JWT)        ││
│  │ (React)      │  │ (IndexedDB)  │  │                                     ││
│  └──────┬───────┘  └──────┬──────┘  └─────────────────────────────────────┘│
└─────────┼─────────────────┼──────────────────────────────────────────────────┘
          │                 │
          ▼                 │
┌─────────────────────────────────────────────────────────────────────────────┐
│  SERVIDOR (Next.js API Routes / Edge)                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Middleware (src/middleware.ts)                                         │  │
│  │ • Rutas /api/* protegidas salvo login, session, logout, nextauth, lti  │  │
│  │ • Verifica JWT y exige tenantId → 401 si falta                         │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ API Routes + Tenant Context (src/lib/tenant-context.ts)                │  │
│  │ • getSessionFromRequest(), runWithTenant(), getCurrentTenantId()       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  CAPA DE DATOS                                                               │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ DBProvider (src/lib/db-providers/types.ts)                             │  │
│  │ • dexieProvider (cliente, IndexedDB) — por defecto                     │  │
│  │ • postgresProvider (servidor) — cuando DB_PROVIDER=postgres            │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Backend: PostgreSQL + RLS (opcional)                                   │  │
│  │ • SET app.current_tenant_id antes de queries                           │  │
│  │ • Políticas RLS filtran por tenant_id                                  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Flujo de una petición protegida

1. Cliente envía petición con cookie `auth-token` (JWT).
2. Middleware verifica JWT y existencia de `tenantId`; si falla → 401.
3. API Route usa `getSessionFromRequest()` o `runWithTenant()` para establecer contexto.
4. Capa de datos (DBProvider) usa `getCurrentTenantId()` si está en servidor con PostgreSQL.
5. PostgreSQL ejecuta `SET app.current_tenant_id` y RLS filtra por tenant.

---

## Arquitectura prevista

- **Producción SaaS:** `DB_PROVIDER=postgres`, múltiples inquilinos, RLS activo.
- **Escalabilidad:** Pool de conexiones, auditoría en PostgreSQL (`audit_logs`).
- **Seguridad:** Cifrado PII (Key Vault), TLS 1.3, cumplimiento OWASP ASVS Nivel 1.
- **Integraciones:** LTI 1.3 (plataformas externas), SCORM 2004 (contenidos).

---

## Separación: artefactos de planificación vs entidades de negocio

### Artefactos de planificación (tickets TT-XXX)

Los tickets TT-101 a TT-117 son **solo una forma de organizar y seguir las tareas de desarrollo**. No son parte del dominio de la aplicación. Documentados en `docs/MIGRATION_PLAN_TICKETS.md`.

### Relaciones entre tickets, epics y dependencias

```
Epics:
├── EPIC-TENANT (Multi-Tenant)
│   ├── TT-101 (RLS) ─────────────────────────┐
│   └── TT-102 (Middleware tenant) ───────────┼──► Dependencias base
├── EPIC-SECURITY                             │
│   ├── TT-103 (UUID v4) ◄── TT-101           │
│   └── TT-104 (Cifrado PII)                  │
├── EPIC-LTI                                  │
│   ├── TT-105 (OIDC) ◄── TT-102              │
│   └── TT-106 (Resource Link) ◄── TT-105     │
├── EPIC-SCORM                                │
│   ├── TT-107 (API SCORM)                    │
│   └── TT-108 (Persistencia CMI) ◄── TT-107  │
├── EPIC-AUDIT                                │
│   ├── TT-109 (Logs auditoría) ◄── TT-102    │
│   └── TT-110 (ARCO/RGPD) ◄── TT-101         │
├── EPIC-MIGRATION                            │
│   └── TT-111 (Script IndexedDB→PG) ◄── TT-103│
├── DOCUMENTACIÓN                             │
│   └── TT-112 (Arquitectura)                 │
├── VALIDACIÓN / QA                           │
│   └── TT-113 (Seguridad) ◄── Todos          │
└── EPIC-POSTGRESQL (Fase 2)
    ├── TT-114 (Provider PG) ◄── TT-101, TT-102
    ├── TT-115 (SET tenant en API) ◄── TT-114
    ├── TT-116 (Audit en PG) ◄── TT-114
    └── TT-117 (Tests PG+RLS) ◄── TT-114, TT-115
```

### Ciclo de vida de un ticket del plan

```
[Epic] → [Ticket TT-XXX] → [Criterios de aceptación] → [Implementación] → [Estado]
                                                              │
                                                              ▼
                                              [Hecho | En progreso | Pendiente]
```

### Entidades de negocio con ciclo de vida

Enrollment, PDI, ComplianceAudit, Course y User tienen estados y transiciones. Son entidades del dominio. **No deben confundirse con tickets ni documentarse como tales.**

---

## Modelo de dominio real

Las entidades principales de la aplicación y sus relaciones:

### Diagrama simplificado

```
User (tenantId, role, department)
  │
  ├── Enrollment ──► Course (studentId, courseId, status)
  │
  ├── UserProgress ──► Course (completedModules)
  │
  ├── IndividualDevelopmentPlan (PDI) ◄── User (manager)
  │     └── milestones, reviews
  │
  ├── RegulationCompliance ◄── Regulation
  │
  ├── Certificate ◄── Course, CertificateTemplate
  │
  └── Notification, ForumMessage, ChatMessage, etc.

Course
  ├── Module[]
  ├── Enrollment[]
  ├── ForumMessage[]
  └── CalendarEvent[]

Regulation
  ├── RegulationCompliance[]
  └── ComplianceAudit[]
```

### Entidades con ciclo de vida (estados y transiciones)

| Entidad                       | Estados                                                                         | Relación con usuarios            |
| ----------------------------- | ------------------------------------------------------------------------------- | -------------------------------- |
| **Enrollment**                | pending, approved, rejected, active, completed, expelled, expired, needs_review | User ↔ Course                    |
| **IndividualDevelopmentPlan** | draft, active, completed, archived                                              | User (empleado) + User (manager) |
| **ComplianceAudit**           | draft, completed, archived                                                      | Regulation + auditor             |
| **Course**                    | draft, published                                                                | —                                |
| **User**                      | pending_approval, approved, suspended                                           | —                                |

---

## Módulos principales

| Módulo         | Ubicación                              | Función                                 |
| -------------- | -------------------------------------- | --------------------------------------- |
| DBProvider     | `src/lib/db-providers/`                | Abstracción de datos (Dexie/PostgreSQL) |
| Tenant context | `src/lib/tenant-context.ts`            | Contexto de inquilino por request       |
| Middleware     | `src/middleware.ts`                    | Verificación JWT + tenantId             |
| Audit          | `src/lib/audit/`                       | Logs de auditoría                       |
| GDPR           | `src/lib/gdpr.ts`                      | Exportación ARCO, borrado lógico        |
| LTI            | `src/lib/lti/`                         | Integración LTI 1.3                     |
| SCORM          | `src/lib/scorm-api.ts`, `scorm-cmi.ts` | API SCORM 2004, persistencia CMI        |
| Migraciones    | `migrations/`                          | Esquema PostgreSQL, RLS                 |

---

## Documentos relacionados

- [ARCHITECTURE_MULTITENANT_AND_SECURITY.md](./docs/ARCHITECTURE_MULTITENANT_AND_SECURITY.md) — Detalle de seguridad y multi-tenant
- [MIGRATION_PLAN_TICKETS.md](./docs/MIGRATION_PLAN_TICKETS.md) — Plan de migración y tickets TT-XXX
- [MIGRATION_STATUS.md](./docs/MIGRATION_STATUS.md) — Estado actual del plan
- [DATABASE_STRUCTURE_AND_TECH.md](./docs/DATABASE_STRUCTURE_AND_TECH.md) — Estructura de BD
