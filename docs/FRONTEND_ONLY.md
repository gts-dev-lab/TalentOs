# Modo solo frontend (sin auth ni base de datos)

Para ver **solo la interfaz** construida, sin autenticación ni conexión a base de datos:

```bash
npm run dev:frontend
```

Se levanta Next.js en http://localhost:3000 con:

- **Sin login**: puedes navegar a todas las rutas sin iniciar sesión.
- **Usuario mock**: el header y la sidebar muestran "Usuario demo" (no se llama a la API de sesión).
- **Sin BD**: las llamadas a `/api/*` fallarán (401/503); las páginas se renderizan con su UI y datos vacíos o de ejemplo.

Variable de entorno usada: `NEXT_PUBLIC_FRONTEND_ONLY=true` (el script `dev:frontend` la define automáticamente).

---

## Páginas creadas (rutas)

### Públicas (landing, auth, legales)

| Ruta                   | Descripción                     |
| ---------------------- | ------------------------------- |
| `/`                    | Inicio / landing                |
| `/login`               | Login                           |
| `/register`            | Registro                        |
| `/forgot-password`     | Recuperar contraseña            |
| `/password-reset`      | Reset de contraseña             |
| `/pending-approval`    | Cuenta pendiente de aprobación  |
| `/features`            | Funcionalidades                 |
| `/terms`               | Términos                        |
| `/privacy-policy`      | Política de privacidad          |
| `/request-demo`        | Solicitar demo                  |
| `/certificates/verify` | Verificar certificado (público) |
| `/auth/error`          | Error de autenticación          |

### Dashboard (tras login o en modo frontend-only)

| Ruta                                    | Descripción                     |
| --------------------------------------- | ------------------------------- |
| `/dashboard`                            | Redirige al dashboard principal |
| `/dashboard/dashboard`                  | Dashboard principal             |
| `/dashboard/courses`                    | Listado de cursos               |
| `/dashboard/courses/new`                | Nuevo curso                     |
| `/dashboard/courses/create`             | Crear curso                     |
| `/dashboard/courses/[id]`               | Detalle de curso                |
| `/dashboard/courses/[id]/edit`          | Editar curso                    |
| `/dashboard/courses/[id]/scorm-player`  | Reproductor SCORM               |
| `/dashboard/courses/ai-generator`       | Generador de cursos con IA      |
| `/dashboard/courses/scorm-import`       | Importar SCORM                  |
| `/dashboard/courses/edit`               | Edición (legacy?)               |
| `/dashboard/enrollments`                | Inscripciones                   |
| `/dashboard/leaderboard`                | Clasificación                   |
| `/dashboard/certificates`               | Certificados                    |
| `/dashboard/certificates/verify`        | Verificar certificado           |
| `/dashboard/certificates/[id]`          | Ver certificado                 |
| `/dashboard/learning-paths`             | Planes de carrera               |
| `/dashboard/learning-paths/new`         | Nuevo plan                      |
| `/dashboard/learning-paths/[id]/edit`   | Editar plan                     |
| `/dashboard/pdi`                        | PDI                             |
| `/dashboard/pdi/new`                    | Nuevo PDI                       |
| `/dashboard/pdi/[id]`                   | Detalle PDI                     |
| `/dashboard/pdi/[id]/edit`              | Editar PDI                      |
| `/dashboard/calendar`                   | Calendario                      |
| `/dashboard/library`                    | Biblioteca                      |
| `/dashboard/users`                      | Empleados                       |
| `/dashboard/users/new`                  | Nuevo empleado                  |
| `/dashboard/users/bulk-import`          | Importación masiva              |
| `/dashboard/users/[id]`                 | Detalle usuario                 |
| `/dashboard/users/[id]/edit`            | Editar usuario                  |
| `/dashboard/nomina`                     | Nómina                          |
| `/dashboard/analytics`                  | Analíticas                      |
| `/dashboard/chat`                       | Chat                            |
| `/dashboard/communications`             | Comunicaciones                  |
| `/dashboard/compliance`                 | Cumplimiento                    |
| `/dashboard/compliance/new`             | Nueva auditoría                 |
| `/dashboard/compliance/[id]`            | Detalle auditoría               |
| `/dashboard/costs`                      | Costes                          |
| `/dashboard/costs/categories`           | Categorías de costes            |
| `/dashboard/instructors`                | Formadores                      |
| `/dashboard/instructors/[id]/analytics` | Analíticas formador             |
| `/dashboard/logs`                       | Logs                            |
| `/dashboard/profile`                    | Perfil                          |
| `/dashboard/preferences`                | Preferencias                    |
| `/dashboard/settings`                   | Ajustes                         |
| `/dashboard/settings/certificates`      | Ajustes certificados            |

Rutas dinámicas: sustituir `[id]` por un valor (ej. `abc-123`) para ver la página de detalle/edición.
