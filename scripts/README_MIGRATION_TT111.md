# TT-111: Migración IndexedDB → PostgreSQL

## 1. Exportar datos desde la app (navegador)

1. Inicia sesión en TalentOS (con datos en IndexedDB).
2. Ve a **Mi Perfil** → pestaña **Datos y privacidad**.
3. Pulsa **Exportar para migración PostgreSQL**. Se descargará un JSON con usuarios, cursos, matriculaciones, progreso, notificaciones, certificados, etc.
4. Guarda el archivo (ej. `talentos-migration-export-2025-01-15.json`).

## 2. Preparar PostgreSQL

- Crea la base de datos y ejecuta las migraciones en `migrations/` (001, 002, 003).
- Crea al menos un inquilino en `public.tenants` y anota su UUID (será el `tenant_id` de la carga).
- Configura `DATABASE_URL` (ej. `postgresql://usuario:contraseña@localhost:5432/talentos`).

## 3. Ejecutar el script de carga

Instala la dependencia (solo para ejecutar el script):

```bash
npm install pg
```

Ejecuta:

```bash
node scripts/migrate-indexeddb-to-postgres.mjs <ruta-al-export.json> <tenant_uuid> [DATABASE_URL]
```

Ejemplo:

```bash
node scripts/migrate-indexeddb-to-postgres.mjs ./talentos-migration-export-2025-01-15.json 550e8400-e29b-41d4-a716-446655440000
```

Si no pasas `DATABASE_URL` como tercer argumento, se usará la variable de entorno `DATABASE_URL`.

## 4. Qué hace el script

- **Mapeo a UUID:** Asigna nuevos UUID a usuarios y cursos; las tablas dependientes (enrollments, user_progress, notifications, certificates) usan esos UUID, de modo que no se pierde el historial ni las relaciones.
- **tenant_id:** Todas las filas insertadas llevan el `tenant_id` indicado.
- **Tablas cargadas:** users, courses, enrollments, user_progress, notifications, certificate_templates (o una por defecto), certificates, scorm_cmi_state (si la tabla existe).
- **Conflictos:** Usa `ON CONFLICT ... DO NOTHING` o `DO UPDATE` donde aplica para poder re-ejecutar sin duplicar.

## 5. Cero pérdida de historial

- Progreso por curso (`completed_modules`) se mantiene.
- Matriculaciones y estados se migran.
- Certificados se vinculan a la plantilla por defecto si no hay plantillas en el export.
- Estado CMI SCORM (si existe la tabla) se carga para reanudar donde se dejó.
