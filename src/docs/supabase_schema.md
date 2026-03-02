# Esquema de Tablas para Supabase

> **Nota sobre la Arquitectura:** Este archivo define el esquema para la base de datos en **Supabase**, que actúa como el backend persistente para la sincronización. La base de datos principal de la aplicación sigue siendo **Dexie.js** en el navegador.

Aquí tienes la estructura de las tablas principales que necesitas configurar en tu base de Supabase para la aplicación TalentOS.

**Consejo:** Los nombres de las tablas y las columnas deben ser exactos (respetando mayúsculas y minúsculas) para que la aplicación funcione. Ve al "Table Editor" en tu proyecto de Supabase para crearlas.

---

### Clave de Sincronización (`id`)

Para que la sincronización entre la base de datos local (Dexie) y la remota (Supabase) funcione correctamente, cada tabla en Supabase debe tener una columna `id` de tipo `text`. Esta columna debe ser la **Clave Primaria (Primary Key)** y **NO** debe ser autoincremental. Usaremos los IDs generados por Dexie (que son strings, ej: 'user_1') como la clave única en ambos sistemas.

---

### Activación de Políticas de Seguridad (RLS)

Por seguridad, es **crucial** que actives "Row Level Security" (RLS) para cada tabla que crees. Una vez activado, deberás crear políticas (policies) para permitir el acceso. Para la sincronización del lado del servidor, las operaciones usarán la `service_role_key`, que ignora las políticas RLS. Sin embargo, es una buena práctica tenerlas configuradas si planeas acceder a los datos desde el cliente en el futuro.

**Ejemplo de Política "Permitir Acceso a Usuarios Autenticados":**

- **Policy Name:** `Allow authenticated read access`
- **Target Roles:** `authenticated`
- **USING expression:** `auth.uid() = userId` (asumiendo que tienes una columna `userId`)
- **WITH CHECK expression:** `auth.uid() = userId` (Para INSERT y UPDATE)

---

## 1. Tabla de Usuarios (`Users`)

Almacena la información de cada persona en la plataforma.

| Nombre de la Columna   | Tipo de Dato  | Notas                                                 |
| :--------------------- | :------------ | :---------------------------------------------------- |
| `id`                   | `text`        | **Clave Primaria (Primary Key)**. No autoincremental. |
| `name`                 | `text`        |                                                       |
| `email`                | `text`        | Debe ser único.                                       |
| `avatar`               | `text`        | URL de la imagen.                                     |
| `role`                 | `text`        |                                                       |
| `department`           | `text`        |                                                       |
| `points`               | `int4`        | Valor por defecto: `0`                                |
| `status`               | `text`        | `approved`, `pending_approval`, `suspended`           |
| `notificationSettings` | `jsonb`       |                                                       |
| `fcmToken`             | `text`        | Puede ser nulo.                                       |
| `updatedAt`            | `timestamptz` | Valor por defecto: `now()`                            |

---

## 2. Tabla de Cursos (`Courses`)

Contiene todos los detalles de las formaciones.

| Nombre de la Columna | Tipo de Dato  | Notas                                                 |
| :------------------- | :------------ | :---------------------------------------------------- |
| `id`                 | `text`        | **Clave Primaria (Primary Key)**. No autoincremental. |
| `title`              | `text`        |                                                       |
| `description`        | `text`        |                                                       |
| `longDescription`    | `text`        |                                                       |
| `instructor`         | `text`        |                                                       |
| `duration`           | `text`        |                                                       |
| `modality`           | `text`        | `Online`, `Presencial`, `Mixta`                       |
| `image`              | `text`        | URL de la imagen.                                     |
| `status`             | `text`        | `draft`, `published`                                  |
| `capacity`           | `int4`        | Puede ser nulo.                                       |
| `modules`            | `jsonb`       |                                                       |
| `mandatoryForRoles`  | `jsonb`       |                                                       |
| `updatedAt`          | `timestamptz` | Valor por defecto: `now()`                            |
| `aiHint`             | `text`        |                                                       |
| `isScorm`            | `boolean`     | Valor por defecto: `false`                            |

---

## 3. Tabla de Inscripciones (`Enrollments`)

Registra qué usuario está inscrito en qué curso.

| Nombre de la Columna | Tipo de Dato  | Notas                                              |
| :------------------- | :------------ | :------------------------------------------------- |
| `id`                 | `bigint`      | **Clave Primaria (Primary Key)**, autoincremental. |
| `studentId`          | `text`        | El `id` del usuario en la tabla Users.             |
| `courseId`           | `text`        | El `id` del curso en la tabla Courses.             |
| `status`             | `text`        | `pending`, `approved`, `rejected`, etc.            |
| `requestDate`        | `timestamptz` | Valor por defecto: `now()`                         |
| `updatedAt`          | `timestamptz` | Valor por defecto: `now()`                         |

---

## 4. Tabla de Progreso (`UserProgress`)

Guarda el progreso de cada usuario en cada curso.

| Nombre de la Columna | Tipo de Dato  | Notas                                              |
| :------------------- | :------------ | :------------------------------------------------- |
| `id`                 | `bigint`      | **Clave Primaria (Primary Key)**, autoincremental. |
| `userId`             | `text`        | El `id` del usuario en la tabla Users.             |
| `courseId`           | `text`        | El `id` del curso en la tabla Courses.             |
| `completedModules`   | `jsonb`       |                                                    |
| `updatedAt`          | `timestamptz` | Valor por defecto: `now()`                         |

---

Con estas tablas configuradas en Supabase, tendrás una base de datos lista para funcionar con la aplicación. Asegúrate de que los nombres de las tablas y las columnas coincidan exactamente.
