# Auditoría del modelo de datos y plan de estandarización

**Rol:** Arquitecto de Datos Senior / Experto en Seguridad Cloud  
**Objetivo:** Auditar el modelo de datos actual del LMS SaaS TalentOS y proponer una evolución hacia estándares **LTI 1.3**, **SCORM 2004 4.ª ed.**, **RGPD** y **OWASP ASVS v4.0.3**.

**Stack actual:** TypeScript, Dexie.js (IndexedDB en el navegador). No hay modelos SQLAlchemy/SQLModel ni Alembic; la estructura está en `src/lib/types.ts` y `src/lib/db-providers/dexie.ts`.

---

## Paso 1: Detección y análisis

### 1.1 Modelo de tenencia

| Pregunta | Respuesta |
|----------|-----------|
| **¿Base compartida con discriminación por filas?** | No. No existe columna `tenant_id` ni ningún mecanismo de multi-tenant por filas. |
| **¿Esquemas separados por inquilino?** | No. IndexedDB no usa esquemas; hay una sola base `TalentOSDB` por origen. |
| **¿Bases de datos dedicadas por inquilino?** | En la práctica **sí**, pero por limitación del navegador: cada origen (dominio) tiene su propia IndexedDB. No hay concepto explícito de “inquilino”: es **single-tenant por despliegue** (un despliegue = una organización que usa la app en su dominio). |

**Conclusión:** El modelo actual es **single-tenant implícito** (una BD por origen). Para SaaS multi-tenant con varios clientes en la misma instalación habría que introducir **tenant_id** o pasar a esquema/BD por inquilino cuando se use un servidor de datos.

---

### 1.2 Identificadores

| Tipo de tabla | Cantidad | Formato del ID | ¿UUID v4? |
|---------------|----------|----------------|-----------|
| **Clave primaria string** | 10 tablas | Prefijo + timestamp + aleatorio, ej. `user_${Date.now()}_${Math.random().toString(36).substring(2,9)}` | **No** |
| **Clave primaria numérica (++id)** | 18 tablas | Auto-increment Dexie | N/A (no UUID) |
| **Singletons / por rol** | 2 (aiConfig, rolePermissions) | `id: 'singleton'` o `role` | N/A |

**Tablas con PK string (no UUID v4):**  
users, courses, chatChannels, badges, certificates, certificateTemplates, individualDevelopmentPlans, regulations, regulationCompliance, complianceAudits.

**Generación actual de IDs string (en `dexie.ts`):**
- Usuario: `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
- Curso: `course_${Date.now()}_...`
- Certificado: `cert_${Date.now()}_...` (verificationCode sí usa `crypto.randomUUID()` en un caso)
- PDI: `pdi_${Date.now()}_...`
- Regulación: `reg_${Date.now()}_...`
- Compliance/Auditoría: `comp_${Date.now()}_...`, `audit_${Date.now()}_...`

**Porcentaje de tablas que usan UUID v4:** **0%**.  
Los IDs son predecibles (timestamp + poco entropía), lo que facilita **ataques de enumeración (IDOR)** y no cumple la recomendación LTI de identificadores aleatorios/pseudoaleatorios.

---

### 1.3 Aislamiento de datos (tenant_id)

| Pregunta | Respuesta |
|----------|-----------|
| **¿Existe columna `tenant_id` en tablas con datos de clientes?** | **No.** No hay ninguna referencia a `tenant_id` ni `tenantId` en el repositorio. |
| **Tablas que contendrían datos por inquilino** | users, courses, enrollments, userProgress, forumMessages, notifications, certificates, individualDevelopmentPlans, regulations, regulationCompliance, complianceAudits, costs, calendarEvents, chatChannels, chatMessages, announcements, learningPaths, userLearningPathProgress, courseRatings, userBadges, externalTrainings, resources, courseResources, rolePermissions, systemLogs, aiConfig, aiUsageLog, certificateTemplates, badges, costCategories. |

**Conclusión:** Con el modelo actual no se puede ofrecer **multi-tenant seguro** en una misma base: no hay aislamiento por inquilino. Para SaaS multi-tenant habría que añadir `tenant_id` (o equivalente) en todas las tablas que almacenan datos de clientes.

---

### 1.4 Resumen del análisis

| Criterio | Estado actual | Observación |
|----------|----------------|-------------|
| **Tenencia** | Single-tenant implícito (1 BD por origen) | Sin soporte multi-tenant explícito. |
| **UUID v4** | 0% de tablas con PK string usan UUID v4 | Riesgo IDOR; no alineado con LTI. |
| **tenant_id** | 0% de tablas con datos de cliente tienen tenant_id | Sin aislamiento por inquilino. |
| **Auditoría (created_at, updated_at, deleted_at)** | Parcial | Varias tablas tienen `updatedAt`; no todas tienen `createdAt`; ninguna tiene `deleted_at` (soft delete). |
| **Formato de fechas** | ISO 8601 en comentarios | No hay exigencia explícita de UTC en tipos. |
| **PII en reposo** | Sin encriptación | name, email, phone, etc. en claro (OWASP ASVS). |
| **LTI 1.3** | No implementado | No hay `resource_link_id`, `deployment_id` ni modelo LTI. |
| **SCORM RTE** | Parcial | Hay `scormPackage`/Blob; no hay modelo explícito para `cmi.score.scaled`, `cmi.location` (string 1000) como en SCORM 2004. |

---

## Paso 2: Plan de mejora según estándares

### 2.1 Aislamiento SaaS (multi-tenant)

- **Objetivo:** Poder servir varios inquilinos en la misma instalación sin fugas de datos.
- **Acciones:**
  1. Introducir tipo/entidad **Tenant** (por ejemplo `id: string` UUID, `name`, `slug`, `createdAt`, `updatedAt`).
  2. Añadir **`tenantId: string`** (obligatorio) en todas las tablas que contengan datos de clientes (users, courses, enrollments, userProgress, certificates, notifications, etc.).
  3. En cada consulta y mutación, filtrar/escribir por `tenantId` (derivado de sesión/JWT).
  4. Añadir índice compuesto `[tenantId+...]` en las tablas críticas para rendimiento.
- **Nota:** Con IndexedDB actual (un almacén por origen), el primer paso puede ser preparar tipos y capa de acceso; el filtrado por `tenantId` será obligatorio cuando exista un backend (p. ej. PostgreSQL con RLS).

### 2.2 Identificadores (UUID v4 / OWASP / LTI)

- **Objetivo:** Eliminar IDs predecibles y alinearse con LTI y buenas prácticas.
- **Acciones:**
  1. Sustituir generación de IDs string por **UUID v4** (`crypto.randomUUID()` en entorno actual).
  2. Aplicar a: User, Course, Enrollment (si se pasa a PK string), Certificate, IndividualDevelopmentPlan, Regulation, RegulationCompliance, ComplianceAudit, ChatChannel (cuando id sea string), Badge, CertificateTemplate.
  3. Mantener PK numérica donde tenga sentido (p. ej. logs, mensajes) pero exponer **identificadores públicos** tipo UUID para APIs externas (LTI, integraciones).
  4. Documentar que los IDs públicos (resource_link_id, deployment_id) serán **inmutables** y **ASCII ≤ 255 caracteres** cuando se implemente LTI 1.3.

### 2.3 Seguridad (OWASP ASVS – datos en reposo)

- **Objetivo:** Proteger PII en reposo (ASVS).
- **Acciones:**
  1. **Identificar PII:** name, email, phone (User); userName, userAvatar, message en foro/chat; comentarios en formaciones externas; findings/recommendations en auditorías si contienen datos personales.
  2. **Encriptación AES-256:** En un modelo con servidor, encriptar campos PII en reposo (columna o nivel de disco). En el modelo actual 100% cliente (IndexedDB), valorar:
     - Encriptación en aplicación (clave derivada de contraseña o de clave por tenant) antes de escribir en IndexedDB, o
     - Migrar datos sensibles a un backend que aplique encriptación y control de acceso.
  3. **Contraseñas:** Ya se usa Argon2 (hash). Mantener y no almacenar contraseñas en claro.

### 2.4 Interoperabilidad LTI 1.3

- **Objetivo:** Preparar el modelo para LTI 1.3.
- **Acciones:**
  1. Añadir entidades (o campos) para **Deployment** y **Resource Link**: identificadores inmutables, ASCII, max 255 caracteres.
  2. Usar **UUID v4** (o equivalentes) para `deployment_id`, `resource_link_id` cuando se implemente el flujo LTI.
  3. Vincular cursos/actividades con `resource_link_id` y plataforma con `deployment_id` para trazabilidad y seguridad.

### 2.5 Trazabilidad y auditoría (RGPD / forense)

- **Objetivo:** Auditoría y cumplimiento normativo (UTC ISO 8601).
- **Acciones:**
  1. **Campos estándar** en todas las tablas con datos de negocio:
     - `createdAt: string` (ISO 8601 UTC)
     - `updatedAt?: string` (ISO 8601 UTC)
     - `deletedAt?: string` (soft delete, ISO 8601 UTC)
  2. Normalizar fechas existentes (`timestamp`, `requestDate`, `issuedAt`, etc.) a **UTC** y documentar en tipos que deben ser ISO 8601 UTC.
  3. Donde aplique RGPD (ej. datos personales), asegurar que se pueda responder a **derecho al olvido** (borrado o anonimización) y que `deletedAt` y logs permitan demostrar cuándo se eliminó qué.

### 2.6 SCORM 2004 4.ª ed. (Run-Time Environment)

- **Objetivo:** Persistir estado del RTE según SCORM.
- **Acciones:**
  1. Definir modelo (tabla o documento) para **estado de intento SCORM**: por ejemplo `registration_id` (o equivalente), `cmi.score.scaled` (número real, precisión 10,7), `cmi.location` (string, max 1000), y demás elementos del RTE que se necesiten.
  2. Vincular a `userId`, `courseId` y, si aplica, `tenantId`.
  3. Validar esquema (longitudes, tipos) antes de persistir para evitar inyección de datos malformados.

### 2.7 Sanitización y validación (OWASP)

- **Objetivo:** Evitar inyección de datos malformados.
- **Acciones:**
  1. Validar con **Zod** (o similar) todos los payloads antes de escribir en Dexie/API.
  2. Esquemas JSON para LTI y SCORM antes de aceptar entradas.
  3. Longitudes máximas y tipos claros en tipos TypeScript y en validación en runtime.

---

## Paso 3: Ejecución de cambios (cuando se apruebe)

Tras aprobar este plan se puede:

1. **Actualizar tipos en `src/lib/types.ts`:**  
   Añadir `tenantId` donde corresponda, `createdAt`/`updatedAt`/`deletedAt` estándar, y tipos para LTI/SCORM RTE.

2. **Actualizar esquema Dexie en `src/lib/db-providers/dexie.ts`:**  
   Nueva versión (46+) con índices para `tenantId`, y migraciones en `version(N).stores({...})` que añadan columnas sin romper datos existentes (valores por defecto para tenant si se mantiene single-tenant al inicio).

3. **Generar IDs con UUID v4:**  
   Reemplazar en `dexie.ts` las generaciones `user_${Date.now()}_...` por `crypto.randomUUID()` (o helper centralizado).

4. **Backend futuro (PostgreSQL/SQLite):**  
   - Scripts de migración (Alembic si Python, o Knex/Drizzle/Prisma si Node) para crear tablas con tenant_id, UUIDs y auditoría.
   - Si se usa **PostgreSQL**, implementar **Row-Level Security (RLS)** por `tenant_id` para filtrar automáticamente en la capa de BD.  
   **Implementado (TT-101):** ver carpeta raíz `migrations/` (001 extensiones y tenants, 002 esquema con tenant_id y UUIDs, 003 políticas RLS) y [MIGRATION_PLAN_TICKETS.md](./MIGRATION_PLAN_TICKETS.md).

5. **PII:**  
   Definir qué campos se encriptan y aplicar encriptación en aplicación o en backend según el diseño elegido.

---

## Referencia rápida de estándares

| Estándar | Punto relevante |
|----------|------------------|
| **LTI 1.3** | Identificadores inmutables, ASCII ≤255 caracteres; uso de IDs aleatorios/pseudoaleatorios. |
| **SCORM 2004 4.ª ed.** | RTE: `cmi.score.scaled` (10,7), `cmi.location` (string 1000). |
| **RGPD** | Derecho al olvido, minimización de datos, trazabilidad de tratamientos. |
| **OWASP ASVS v4.0.3** | Encriptación de PII en reposo; controles de acceso; prevención de IDOR (identificadores no predecibles). |
| **SaaS multi-tenant** | Aislamiento por tenant_id; estrategias: fila, esquema o BD dedicada según nivel de aislamiento requerido. |

---

---

## Plan de tickets (Epics)

Para la ejecución ordenada de la migración se ha definido un **sistema de tickets tipo JIRA** por Epics (Multi-Tenant, Security, LTI, SCORM, Audit, Migration, Documentación, QA). Ver **[MIGRATION_PLAN_TICKETS.md](./MIGRATION_PLAN_TICKETS.md)** para el desglose completo (TT-101 a TT-113), criterios de aceptación, dependencias y Story Points.

**Arquitectura y seguridad:** Ver **[ARCHITECTURE_MULTITENANT_AND_SECURITY.md](./ARCHITECTURE_MULTITENANT_AND_SECURITY.md)** (TT-112) para diagramas de capas, aislamiento por inquilino y guía Shift-Left para desarrolladores.

*Documento generado como Paso 1 (Análisis) y Paso 2 (Plan) del proceso de estandarización. La ejecución concreta (Paso 3) se realiza siguiendo el plan de tickets en MIGRATION_PLAN_TICKETS.md.*
