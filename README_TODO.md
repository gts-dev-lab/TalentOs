# Tareas pendientes — TalentOS

Lista de tareas para asistentes de código, priorizada por impacto. Basada en el estado real del código y en `docs/MIGRATION_PLAN_TICKETS.md` / `docs/MIGRATION_STATUS.md`.

---

## Diferenciación conceptual

| Tipo                                 | Descripción                                                                                                                       | Ejemplo                             |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| **Tareas técnicas (tickets TT-XXX)** | Artefactos del plan de migración. Dividen y organizan el trabajo de desarrollo. Documentados en `docs/MIGRATION_PLAN_TICKETS.md`. | TT-113, TT-114, TT-117              |
| **Funcionalidades de negocio**       | Entidades del dominio y flujos de la aplicación. No son tickets.                                                                  | Enrollment, PDI, Compliance, Course |

---

## Prioridad alta

### 1. Completar TT-113 (Validación de seguridad)

- **Qué:** Ejecutar pruebas de seguridad y marcar el ticket como hecho.
- **Dónde:** `docs/TT113_SECURITY_QA_CHECKLIST.md`, `docs/TT113_ISOLATION_TESTING_GUIDE.md`
- **Pasos:**
  - `npm run audit` y revisar vulnerabilidades High/Critical
  - `npm run security:zap` (app en `http://localhost:3000`)
  - Pruebas manuales de aislamiento entre inquilinos
  - Rellenar informe en el checklist
  - Actualizar estado en `docs/MIGRATION_PLAN_TICKETS.md`

### 2. Completar TT-114 (Provider PostgreSQL)

- **Qué:** Implementar los métodos restantes (~60%) del provider PostgreSQL.
- **Dónde:** `src/lib/db-providers/postgres.ts`
- **Métodos pendientes (según MIGRATION_PLAN_TICKETS):** Certificates, Forum, Notifications, Resources, Announcements, Chat, Calendar, ExternalTraining, Costs, Badges, AI (AIConfig, AIUsageLog), LearningPaths, PDI, Ratings, Permissions, Logs, Regulations/Compliance
- **Referencia:** Interfaz en `src/lib/db-providers/types.ts`, implementación en Dexie en `src/lib/db-providers/dexie.ts`

### 3. TT-117 (Tests de integración PostgreSQL + RLS)

- **Qué:** Crear tests que validen aislamiento multi-tenant con PostgreSQL real.
- **Criterios:** PostgreSQL en Docker, verificación de RLS, queries sin `SET` devuelven 0 filas, queries con `SET` devuelven solo datos del tenant correcto.
- **Referencia:** `docs/MIGRATION_PLAN_TICKETS.md` — TT-117

---

## Prioridad media

### 4. Documentar API Routes con PostgreSQL

- **Qué:** Usar `withTenant` en rutas API que consuman BD cuando `DB_PROVIDER=postgres`.
- **Dónde:** Rutas en `src/app/api/` que accedan a datos por tenant.

### 5. Migrar rutas API existentes a API Routes

- **Qué:** Si hay lógica de datos en cliente que deba moverse a servidor, crear API Routes con `withTenant` y consumir desde el frontend.

### 6. Ampliar cobertura de tests

- **Qué:** Más tests unitarios y de integración (components, hooks, lib).
- **Dónde:** `src/__tests__/`

---

## Ideas futuras / mejoras (funcionalidades de negocio)

Tareas de mejora sobre entidades del dominio. **No son tickets TT-XXX.**

### 7. Estados y transiciones de Enrollment

- **Qué:** Documentar y validar transiciones permitidas entre estados de Enrollment.
- **Dónde:** `enrollmentStatuses` en `src/lib/types.ts`, lógica en providers y componentes de enrollments.

### 8. Automatizaciones para PDI

- **Qué:** Notificaciones, recordatorios o transiciones automáticas cuando PDI cambia de estado.
- **Dónde:** `IndividualDevelopmentPlan`, `src/app/dashboard/pdi/`

### 9. Mejoras de UX en Compliance

- **Qué:** Alertas, dashboard de vencimientos, flujos de auditoría más claros.
- **Dónde:** `src/app/dashboard/compliance/`, `src/lib/compliance-alerts.ts`

---

## Tareas técnicas (referencia a tickets TT-XXX)

| Ticket | Estado            | Acción sugerida                                           |
| ------ | ----------------- | --------------------------------------------------------- |
| TT-113 | Checklist + tests | Ejecutar pruebas manuales, rellenar informe, marcar hecho |
| TT-114 | ✅ Completado     | Todos los métodos del provider PostgreSQL implementados   |
| TT-117 | Pendiente         | Crear tests de integración PostgreSQL + RLS               |

---

## Comandos útiles

```bash
npm run dev          # Desarrollo
npm run build        # Build producción
npm run test         # Tests
npm run test:security # Tests de middleware
npm run audit        # Auditoría de dependencias
npm run security:zap # Escaneo OWASP ZAP (requiere Docker)
```
