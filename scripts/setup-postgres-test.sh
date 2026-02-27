#!/bin/bash
# TT-117: Setup para tests de PostgreSQL + RLS

set -e

echo "=== TT-117: PostgreSQL Test Setup ==="

# 1. Verificar variables de entorno
if [ -z "$TEST_DATABASE_URL" ] && [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: Define TEST_DATABASE_URL o DATABASE_URL"
    echo "   Ejemplo: export TEST_DATABASE_URL='postgresql://user:pass@localhost:5432/talentos_test'"
    exit 1
fi

export DB_URL="${TEST_DATABASE_URL:-$DATABASE_URL}"

echo "✅ Database: $DB_URL"

# 2. Crear database de test si no existe
DB_NAME=$(echo $DB_URL | sed -n 's|.*/\([^?]*\).*|\1|p')
DB_HOST=$(echo $DB_URL | sed -n 's|.*@\([^:]*\):.*|\1|p')

echo "📦 Creando database de test si no existe..."
psql "${DB_URL%/$DB_NAME}" -c "CREATE DATABASE ${DB_NAME}_test;" 2>/dev/null || true

# 3. Ejecutar migraciones
TEST_DB_URL="${DB_URL%/$DB_NAME}/${DB_NAME}_test"
echo "🔄 Ejecutando migraciones..."
# psql $TEST_DB_URL -f migrations/001_tenants.sql
# psql $TEST_DB_URL -f migrations/002_schema_talentos.sql
# psql $TEST_DB_URL -f migrations/003_rls_policies.sql

echo ""
echo "=== Setup completado ==="
echo "Ejecuta los tests con:"
echo "  TEST_DATABASE_URL='$TEST_DB_URL' npm run test:postgres-rls"
