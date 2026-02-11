# TalentOS: Plataforma de Formación Corporativa con IA

TalentOS es una plataforma de aprendizaje (LMS) moderna, diseñada para empresas que buscan potenciar el talento de sus equipos a través de una experiencia formativa inteligente, personalizada y eficiente.

---

## Objetivo funcional

- **Formación corporativa:** Gestión integral de cursos, matriculaciones, progreso y certificaciones.
- **Multi-inquilino (SaaS):** Aislamiento de datos por inquilino con PostgreSQL RLS y contexto JWT.
- **Estándares:** LTI 1.3, SCORM 2004, RGPD (ARCO), OWASP ASVS.
- **IA integrada:** Genkit para generación de cursos, tutor virtual, recomendaciones, feedback.

---

## Sistema de tickets: qué son y qué NO son

### Qué son los tickets en TalentOS

Los **tickets** son únicamente una forma de **dividir, organizar y seguir las tareas pendientes de desarrollo** de la aplicación. Documentados en `docs/MIGRATION_PLAN_TICKETS.md`.

- **Identificadores:** TT-101, TT-102, TT-103 … TT-117
- **Significado:** Tareas técnicas concretas (equivalente a issues o tickets de JIRA/GitHub)
- **Uso:** Planificar, ejecutar y verificar el progreso del desarrollo
- **Estado:** Ver tabla en `docs/MIGRATION_STATUS.md`

### Qué NO son los tickets

- **NO** es un sistema de negocio
- **NO** existen tickets de soporte, incidencias, solicitudes de usuarios ni flujos de atención
- **NO** forman parte del modelo de dominio de la aplicación
- En el código: **no existen entidades llamadas "tickets"** ni lógica de negocio asociada

### Entidades del dominio (no confundir con tickets)

Algunas entidades (Enrollment, PDI, ComplianceAudit, Course) tienen ciclos de vida con estados. **No deben confundirse con tickets ni documentarse como tales.** Son entidades de negocio independientes.

Si en el futuro se añade un sistema de tickets de negocio (soporte, incidencias, etc.), se tratará como una funcionalidad nueva e independiente.

### Documentos clave

| Documento | Descripción |
|-----------|-------------|
| `docs/MIGRATION_PLAN_TICKETS.md` | Plan completo: epics, tickets, criterios de aceptación, dependencias |
| `docs/MIGRATION_STATUS.md` | Estado actual y progreso (92% Fase 1 completada) |

---

## Estado actual del proyecto

- **Fase 1:** 12/13 tickets completados (92 %)
- **Fase 2 (PostgreSQL):** TT-114 ~40 %, TT-115 y TT-116 hechos, TT-117 pendiente
- **Datos:** Dexie (IndexedDB) por defecto; PostgreSQL opcional con `DB_PROVIDER=postgres`

---

## Tecnologías

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 15 (App Router) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS |
| UI | Shadcn/ui |
| BD local | Dexie.js (IndexedDB) |
| BD servidor | PostgreSQL (opcional) |
| IA | Genkit (Google Gemini) |
| Auth | JWT + NextAuth (modular) |

---

## Ejecución básica

```bash
# Instalar dependencias
npm install

# Desarrollo (Dexie/IndexedDB)
npm run dev

# Producción
npm run build
npm start
```

### Variables de entorno relevantes

- `DB_PROVIDER`: `dexie` (por defecto) o `postgres`
- `DATABASE_URL`: URL de conexión PostgreSQL (cuando `DB_PROVIDER=postgres`)
- `JWT_SECRET`: Firma de tokens
- `TENANT_ID_DEFAULT`: UUID del inquilino por defecto (login)
- `ENCRYPTION_SECRET`: Cifrado PII (≥32 bytes)

---

## Documentación adicional

| Documento | Descripción |
|-----------|-------------|
| [README_DEV.md](./README_DEV.md) | Reglas de desarrollo para asistentes de código |
| [README_TODO.md](./README_TODO.md) | Tareas pendientes y prioridades |
| [README_ARCHITECTURE.md](./README_ARCHITECTURE.md) | Arquitectura y diagramas |
| [docs/MIGRATION_PLAN_TICKETS.md](./docs/MIGRATION_PLAN_TICKETS.md) | Plan de migración y tickets |
| [docs/ARCHITECTURE_MULTITENANT_AND_SECURITY.md](./docs/ARCHITECTURE_MULTITENANT_AND_SECURITY.md) | Seguridad y multi-tenant |
