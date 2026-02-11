-- TalentOS TT-101: Extensiones y tabla de inquilinos
-- Ejecutar como superusuario (postgres) o rol con privilegios de creación.

BEGIN;

-- Extensiones (UUID v4 nativo en PG13+; pgcrypto por si se usa gen_random_uuid() en versiones antiguas)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Rol con el que la aplicación se conecta. NO debe tener BYPASSRLS.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'talentos_app') THEN
    CREATE ROLE talentos_app LOGIN PASSWORD 'CHANGE_IN_PRODUCTION';
  END IF;
END
$$;

-- Base: crear solo si no existe (normalmente la creas tú o el orquestador)
-- CREATE DATABASE talentos OWNER talentos_app;

-- Tabla de inquilinos (fuera de RLS por defecto; solo superuser o rol con privilegios la gestiona)
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')
);

-- Índice para búsqueda por slug (usado en login/contexto)
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants (slug);

-- La app no debe poder crear/eliminar tenants por API normal; eso es operación de provisioning.
GRANT USAGE ON SCHEMA public TO talentos_app;
GRANT SELECT ON public.tenants TO talentos_app;

COMMIT;
