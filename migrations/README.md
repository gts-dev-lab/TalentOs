# Migraciones PostgreSQL — TalentOS (TT-101 RLS)

Estas migraciones configuran el esquema multi-tenant con **Row-Level Security (RLS)** para TalentOS.

## Requisitos

- PostgreSQL 15+
- Ejecutar como superusuario (postgres) o rol con privilegios para crear extensiones y roles.

## Orden de ejecución

1. `001_extensions_and_tenants.sql` — Extensiones y tabla `tenants`
2. `002_schema_talentos.sql` — Tablas del dominio con `tenant_id` y UUIDs
3. `003_rls_policies.sql` — RLS en todas las tablas y rol `talentos_app`

## Rol de la aplicación

- **`talentos_app`**: usuario con el que la aplicación se conecta. **No** tiene `BYPASSRLS`; cada petición debe establecer `SET app.current_tenant_id = '<uuid>'` (middleware TT-102) para que RLS permita acceso a las filas del inquilino.

## Variable de sesión

- `app.current_tenant_id`: UUID del inquilino actual. Debe fijarse al inicio de cada request desde el JWT (TT-102).

## Cómo ejecutar

```bash
# Con psql (ajusta usuario y base de datos). Debe ejecutarse como superusuario (postgres).
export PGHOST=localhost PGPORT=5432 PGDATABASE=talentos PGUSER=postgres
psql -f migrations/001_extensions_and_tenants.sql
psql -f migrations/002_schema_talentos.sql
psql -f migrations/003_rls_policies.sql
```

O con un solo comando:

```bash
for f in migrations/00*.sql; do psql -f "$f"; done
```

## Docker (PostgreSQL solo para desarrollo)

```bash
docker compose -f docker-compose.postgres.yml up -d
# Por defecto: puerto 5433, usuario postgres, contraseña postgres, base talentos.
export PGHOST=localhost PGPORT=5433 PGDATABASE=talentos PGUSER=postgres PGPASSWORD=postgres
for f in migrations/00*.sql; do psql -f "$f"; done
```

Tras las migraciones, la app puede conectarse con el rol `talentos_app` (contraseña definida en 001; en producción usar `ALTER ROLE talentos_app PASSWORD '...';`).
