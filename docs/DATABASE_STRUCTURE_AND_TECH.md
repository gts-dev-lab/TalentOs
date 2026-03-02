# Estructura y tecnología de la base de datos

## Tecnología

- **Motor:** **IndexedDB** (base de datos del navegador).
- **Librería:** **Dexie.js** (wrapper sobre IndexedDB).
- **Dependencias:** `dexie`, `dexie-react-hooks` (ver `package.json`).

La app usa la base de datos **solo en el cliente**: todo se guarda en el navegador del usuario (por origen). No hay servidor de base de datos propio; opcionalmente se puede sincronizar con Supabase.

### Cómo se elige el proveedor

- **`src/lib/db-providers/index.ts`**
  - Variable de entorno: `DB_PROVIDER` (por defecto `dexie`).
  - Si `DB_PROVIDER` no existe o no está implementado, se usa siempre Dexie.

- **`src/lib/db.ts`**
  - Fachada que reexporta todas las funciones del proveedor activo.
  - El resto de la app importa desde `@/lib/db`; así se puede cambiar de proveedor (p. ej. a una API) sin tocar componentes.

---

## Estructura de la base de datos (Dexie)

Nombre de la base: **`TalentOSDB`**.  
Versión actual del esquema: **45** (Dexie usa versionado para migraciones).

### Tablas e índices (versión 45)

| Tabla                          | Clave primaria | Índices                                                                                                                              |
| ------------------------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **courses**                    | `id`           | instructor, status, isScorm, isSynced, \*mandatoryForRoles, [instructor+status]                                                      |
| **users**                      | `id`           | &email, status, points, isSynced, [status+role], [department+status]                                                                 |
| **enrollments**                | ++id           | studentId, courseId, status, isSynced, [studentId+status], [courseId+status], [studentId+courseId]                                   |
| **userProgress**               | ++id           | [userId+courseId], userId, courseId, isSynced, [courseId+userId]                                                                     |
| **forumMessages**              | ++id           | courseId, parentId, timestamp, [courseId+timestamp]                                                                                  |
| **notifications**              | ++id           | userId, isRead, timestamp, [userId+timestamp], [userId+type+relatedUrl], [userId+isRead]                                             |
| **resources**                  | ++id           | name                                                                                                                                 |
| **courseResources**            | ++id           | [courseId+resourceId]                                                                                                                |
| **announcements**              | ++id           | timestamp                                                                                                                            |
| **chatChannels**               | id             | name, type, \*participantIds                                                                                                         |
| **chatMessages**               | ++id           | channelId, timestamp, [channelId+timestamp], [channelId+timestamp+id]                                                                |
| **calendarEvents**             | ++id           | courseId, start, end, isSynced, [courseId+start]                                                                                     |
| **externalTrainings**          | ++id           | userId                                                                                                                               |
| **costs**                      | ++id           | category, courseId, date, isSynced, [category+date], [courseId+date]                                                                 |
| **aiConfig**                   | id             | (singleton)                                                                                                                          |
| **aiUsageLog**                 | ++id           | timestamp                                                                                                                            |
| **badges**                     | id             | —                                                                                                                                    |
| **userBadges**                 | ++id           | [userId+badgeId]                                                                                                                     |
| **costCategories**             | ++id           | &name                                                                                                                                |
| **learningPaths**              | ++id           | targetRole                                                                                                                           |
| **userLearningPathProgress**   | ++id           | [userId+learningPathId]                                                                                                              |
| **courseRatings**              | ++id           | [courseId+userId], courseId, instructorName, [instructorName+timestamp]                                                              |
| **rolePermissions**            | &role          | —                                                                                                                                    |
| **systemLogs**                 | ++id           | timestamp, level, [level+timestamp]                                                                                                  |
| **certificates**               | id             | userId, courseId, status, issuedAt, expiresAt, verificationCode, isSynced, [userId+courseId], [status+expiresAt], [expiresAt+status] |
| **certificateTemplates**       | id             | type, isActive, isSynced                                                                                                             |
| **individualDevelopmentPlans** | id             | userId, managerId, status, startDate, endDate, [userId+status], [managerId+status], isSynced                                         |
| **regulations**                | id             | code, type, isActive, \*applicableRoles, isSynced                                                                                    |
| **regulationCompliance**       | id             | userId, regulationId, complianceDate, expirationDate, [userId+regulationId], [regulationId+expirationDate], isSynced                 |
| **complianceAudits**           | id             | regulationId, auditDate, auditorId, status, isSynced                                                                                 |

Leyenda Dexie:

- `++id`: clave auto-incremental.
- `&campo`: índice único.
- `*campo`: índice multi-entrada (arrays).
- `[a+b]`: índice compuesto.

---

## Dónde está definido cada cosa

| Qué                                  | Dónde                                                                                         |
| ------------------------------------ | --------------------------------------------------------------------------------------------- |
| **Esquema Dexie (tablas e índices)** | `src/lib/db-providers/dexie.ts` (clase `TalentOSDB`, `this.version(41)` … `this.version(45)`) |
| **Tipos TypeScript (entidades)**     | `src/lib/types.ts` (`User`, `Course`, `Enrollment`, etc.)                                     |
| **API de acceso (facade)**           | `src/lib/db.ts` (reexporta todo del proveedor activo)                                         |
| **Implementación por almacén**       | `src/lib/db-providers/dexie.ts` (objeto que implementa la interfaz `DBProvider`)              |
| **Contrato del proveedor**           | `src/lib/db-providers/types.ts` (interfaz `DBProvider`)                                       |

---

## Datos iniciales (seed)

Si la base está vacía, Dexie dispara el evento `populate` y se ejecuta `populateDatabase()` en `src/lib/db-providers/dexie.ts`, que rellena tablas con datos de `src/lib/data.ts` (usuarios, cursos, canales de chat, costes, plantillas de certificados, etc.).

---

## Sincronización opcional

Varios tipos tienen `isSynced` y `updatedAt`. La lógica de sincronización con Supabase (cuando está configurado) está en `src/lib/supabase-sync.ts` y se invoca desde el proveedor Dexie; la base de datos principal sigue siendo IndexedDB (Dexie).
