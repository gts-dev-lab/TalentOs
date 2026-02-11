-- TalentOS TT-101: Row-Level Security (RLS)
-- El rol talentos_app NO tiene BYPASSRLS. Cada petición debe establecer:
--   SET app.current_tenant_id = '<uuid del inquilino>';
-- (middleware TT-102). Sin esto, las políticas no devolverán/insertarán filas.

BEGIN;

-- Esquema para funciones de contexto de la aplicación (tenant, etc.)
CREATE SCHEMA IF NOT EXISTS app;

-- Función auxiliar: devuelve el tenant_id actual de la sesión (NULL si no está fijado)
-- La app debe hacer: SET app.current_tenant_id = '<uuid>'; al inicio de cada request (TT-102).
CREATE OR REPLACE FUNCTION app.current_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_tenant_id', true), '')::uuid;
$$;

GRANT USAGE ON SCHEMA app TO talentos_app;

-- Habilitar RLS en todas las tablas con datos por inquilino

-- tenants: la app solo puede leer (para resolver slug -> id). No INSERT/UPDATE/DELETE.
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenants_select_app ON public.tenants
  FOR SELECT TO talentos_app USING (true);

-- Tablas con tenant_id: acceso solo a filas del inquilino actual
DO $$
DECLARE
  t text;
  tbls text[] := ARRAY[
    'users', 'courses', 'enrollments', 'user_progress', 'notifications',
    'resources', 'course_resources', 'announcements', 'chat_channels', 'chat_messages',
    'forum_messages', 'calendar_events', 'external_trainings', 'cost_categories', 'costs',
    'badges', 'user_badges', 'learning_paths', 'user_learning_path_progress', 'course_ratings',
    'role_permissions', 'system_logs', 'certificate_templates', 'certificates',
    'individual_development_plans', 'regulations', 'regulation_compliance', 'compliance_audits',
    'ai_config', 'ai_usage_log', 'scorm_cmi_state', 'audit_logs'
  ];
BEGIN
  FOREACH t IN ARRAY tbls
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO talentos_app USING (tenant_id = app.current_tenant_id()) WITH CHECK (tenant_id = app.current_tenant_id())',
      t || '_tenant', t
    );
  END LOOP;
END
$$;

-- Asegurar que el rol de la aplicación no pueda saltarse RLS (por defecto no tiene BYPASSRLS)
-- Comprobación: SELECT rolbypassrls FROM pg_roles WHERE rolname = 'talentos_app'; debe ser false
ALTER ROLE talentos_app NOCREATEROLE NOCREATEDB NOINHERIT NOBYPASSRLS;

COMMIT;
