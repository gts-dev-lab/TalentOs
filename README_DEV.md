# Reglas de desarrollo para TalentOS

Documento orientado a asistentes de código (OpenClaw, Cursor, Copilot). Sirve para mantener consistencia y evitar cambios que rompan la arquitectura existente.

---

## Principios a respetar

1. **Multi-tenant:** Todas las operaciones de datos deben filtrarse por `tenantId`. No confiar en `tenantId` del body/URL; usar el de JWT/sesión.
2. **Seguridad:** Validar entradas con Zod; no exponer contraseñas ni tokens en logs; usar UUID v4 para IDs opacos.
3. **DBProvider:** La capa de datos está abstraída en `src/lib/db-providers/`. Evitar acceso directo a Dexie fuera del provider.
4. **Tickets del plan:** Los tickets TT-101 a TT-117 son artefactos de planificación del desarrollo (JIRA-style); NO forman parte del modelo de dominio.

## Norma explícita: no asumir sistemas de tickets de negocio

- **Prohibido** asumir que existe un sistema de tickets de soporte, incidencias o solicitudes.
- En el código no hay entidades "tickets" ni lógica de negocio asociada.
- Las entidades con ciclo de vida (Enrollment, PDI, ComplianceAudit) son funcionalidades distintas; no deben documentarse ni tratarse como tickets.

---

## Qué puede modificar el asistente

| Área               | Permitido                                                                 |
| ------------------ | ------------------------------------------------------------------------- |
| UI/UX              | Componentes, estilos, layout, accesibilidad                               |
| Features nuevas    | Páginas, flujos, endpoints siguiendo la arquitectura                      |
| Tests              | Añadir/ajustar tests (Jest, `src/__tests__/`)                             |
| Correcciones       | Bugs, refactors menores, mejoras de tipos                                 |
| Documentación      | Comentarios, docs, README                                                 |
| Integración TT-114 | Implementar métodos pendientes del provider PostgreSQL según `DBProvider` |

---

## Qué NO debe modificar el asistente sin revisión

| Área                         | Restricción                                                                                          |
| ---------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Interfaz DBProvider**      | No cambiar la firma de métodos en `src/lib/db-providers/types.ts` sin actualizar todos los providers |
| **Middleware de auth**       | `src/middleware.ts`: mantener verificación JWT + `tenantId`; no debilitar seguridad                  |
| **Tenant context**           | `src/lib/tenant-context.ts`: lógica de `getCurrentTenantId()`, `runWithTenant` — crítica para RLS    |
| **Flujo de matriculaciones** | Estados de `Enrollment` en `src/lib/types.ts`: cambios pueden afectar lógica de aprobación           |
| **Políticas RLS**            | Migraciones en `migrations/`: no eliminar ni relajar políticas sin justificación                     |
| **LTI/SCORM**                | Cambios en `src/lib/lti/` y `src/lib/scorm-*` pueden romper integraciones estándar                   |

---

## Tickets TT-XXX: artefactos de planificación

Los tickets (TT-101 … TT-117) son tareas técnicas de planificación del desarrollo, equivalentes a issues de JIRA/GitHub. Al implementar o documentar:

- Usar el estado de `docs/MIGRATION_PLAN_TICKETS.md` y `docs/MIGRATION_STATUS.md`.
- No confundirlos con funcionalidades de negocio ni con entidades del dominio.

## Entidades del dominio con ciclo de vida

Enrollment, PDI, ComplianceAudit y Course tienen estados y transiciones. Son **entidades de negocio**, no tickets. Mantener compatibilidad con `enrollmentStatuses`, `PDIStatus`, etc. No romper el flujo de aprobación de matriculaciones (`src/lib/db-providers/*`, `src/app/dashboard/enrollments/`, `src/components/enrollments/`).

---

## Estructura de carpetas clave

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes (usar withTenant si DB_PROVIDER=postgres)
│   ├── dashboard/         # Páginas del dashboard
│   └── auth/              # Login, register, etc.
├── lib/
│   ├── db-providers/      # Dexie, Postgres — implementan DBProvider
│   ├── tenant-context.ts  # Contexto de inquilino
│   ├── audit/             # Auditoría (TT-109)
│   ├── gdpr.ts            # ARCO / RGPD (TT-110)
│   ├── lti/               # LTI 1.3
│   ├── scorm-api.ts       # API SCORM 2004
│   └── scorm-cmi.ts       # Persistencia CMI
├── components/            # Componentes reutilizables
└── __tests__/             # Tests
```

---

## Convenciones de código

- **IDs:** Usar `uuid()` de `src/lib/uuid.ts` para entidades nuevas.
- **Tenant:** Si una operación necesita tenant, usar `getCurrentTenantId()` dentro de `runWithTenant`.
- **API Routes:** Para PostgreSQL, envolver handlers con `withTenant` de `src/lib/api-with-tenant.ts`.
- **Tipos:** Definir en `src/lib/types.ts`; reutilizar en providers y componentes.

---

## Antes de proponer cambios estructurales

1. Verificar impacto en multi-tenant y RLS.
2. Comprobar compatibilidad con Dexie y PostgreSQL (si aplica).
3. Documentar cambios en `docs/` si afectan arquitectura o plan de migración.
4. Revisar que no se rompan tests existentes (`npm run test`, `npm run test:security`).
