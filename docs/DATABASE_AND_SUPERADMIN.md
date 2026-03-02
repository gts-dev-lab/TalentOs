# Base de datos en servidor y Superadministrador

## Base de datos recomendada para multi-usuario autoalojado

Para una app seria multi-usuario y autoalojada se recomienda **SQLite** como primera opción:

| Criterio       | SQLite                                | PostgreSQL                            |
| -------------- | ------------------------------------- | ------------------------------------- |
| **Despliegue** | Un solo archivo, sin proceso extra    | Requiere servidor/contenedor Postgres |
| **Backup**     | Copiar el archivo `.sqlite`           | `pg_dump` o replicas                  |
| **Docker**     | Muy simple (volumen con un archivo)   | Imagen oficial, más recursos          |
| **Escala**     | Ideal 1 nodo, hasta miles de usuarios | Multi-nodo, réplicas                  |

**Recomendación:** Empezar con **SQLite** (por ejemplo con `better-sqlite3` o **libsql/Turso** en Node). Si más adelante necesitas réplicas o equipo que ya usa Postgres, se puede migrar a PostgreSQL.

- **SQLite (libsql/better-sqlite3):** Una base de datos por archivo, cero configuración, ideal para autoalojado en un solo servidor.
- **Turso:** SQLite en la nube (libsql), si quieres hosting gestionado más adelante.
- **PostgreSQL:** Buena opción si ya lo usas o planeas alta disponibilidad.

La app actual usa **Dexie (IndexedDB)** en el navegador. Para pasar a SQLite/Postgres haría falta añadir una capa API en el servidor que lea/escriba en esa base de datos y, opcionalmente, seguir usando Dexie como caché/offline en el cliente.

---

## Superadministrador

La figura de **superadministrador** se configura por variables de entorno y tiene:

- Acceso a **todos los menús** (igual que Administrador General y además sin depender de permisos por rol).
- Acceso a **Ajustes** (permisos, IA, certificados, sincronización, backup, APIs).
- Acceso a **Registro del sistema** (logs).
- Acceso a **Empleados** y **aprobación de accesos** (solicitudes pendientes).
- Acceso a **Certificados** (ver todos y columna de usuario).

No depende del rol asignado en la app: basta con que el **email** del usuario esté en la lista configurada.

### Configuración

En `.env` o `.env.local` (desarrollo) y en `.env.production` (producción):

```env
# Un solo email
NEXT_PUBLIC_SUPERADMIN_EMAILS=admin@empresa.com

# Varios emails (separados por coma)
NEXT_PUBLIC_SUPERADMIN_EMAILS=admin@empresa.com,superadmin@empresa.com,otro@empresa.com
```

- La variable es **NEXT*PUBLIC*** para que la comprobación funcione en cliente y servidor.
- Los emails se comparan en **minúsculas** y sin espacios; los espacios alrededor de las comas se ignoran.
- Quien inicie sesión con uno de esos emails tendrá permisos de superadmin aunque su rol en la app sea otro (por ejemplo Trabajador).

### Cómo obtener permisos de superadmin

1. El usuario debe **existir** en la app (registrado o dado de alta).
2. Su **email** debe estar en `NEXT_PUBLIC_SUPERADMIN_EMAILS`.
3. Tras iniciar sesión, verá todo el menú y podrá entrar en Ajustes, Logs, Empleados (y aprobar accesos), Certificados, etc.

### Seguridad

- No subas el archivo `.env` con emails reales al repositorio.
- En producción, configura `NEXT_PUBLIC_SUPERADMIN_EMAILS` en el entorno del servidor o en tu archivo de variables seguro.
