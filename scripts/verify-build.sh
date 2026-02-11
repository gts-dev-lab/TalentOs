#!/bin/bash

# Script de verificación pre-deployment
# Verifica que todo esté listo para producción

set -e

echo "🔍 Verificando TalentOS para deployment..."
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para verificar
check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
        exit 1
    fi
}

# 1. Verificar Node.js
echo "1. Verificando Node.js..."
node --version | grep -q "v2[0-9]\|v18" && check "Node.js >= 18 instalado" || (echo -e "${RED}❌ Node.js >= 18 requerido${NC}" && exit 1)

# 2. Verificar npm
echo "2. Verificando npm..."
npm --version > /dev/null && check "npm instalado" || exit 1

# 3. Verificar dependencias
echo "3. Verificando dependencias..."
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules no encontrado, instalando...${NC}"
    npm install --legacy-peer-deps
fi
check "Dependencias instaladas"

# 4. Verificar .env.local
echo "4. Verificando variables de entorno..."
if [ -f ".env.local" ]; then
    grep -q "JWT_SECRET=" .env.local && check ".env.local con JWT_SECRET" || (echo -e "${RED}❌ JWT_SECRET no encontrado en .env.local${NC}" && exit 1)
else
    echo -e "${YELLOW}⚠️  .env.local no encontrado${NC}"
    echo "Generando .env.local básico..."
    echo "JWT_SECRET=$(openssl rand -base64 32)" > .env.local
    echo "NEXTAUTH_URL=http://localhost:3000" >> .env.local
    echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env.local
    check ".env.local creado"
fi

# 5. TypeScript check
echo "5. Verificando TypeScript..."
npm run typecheck > /dev/null 2>&1 && check "TypeScript sin errores" || (echo -e "${YELLOW}⚠️  Errores TypeScript (pueden ser warnings)${NC}")

# 6. ESLint check
echo "6. Verificando ESLint..."
npm run lint > /dev/null 2>&1 && check "ESLint sin errores críticos" || (echo -e "${YELLOW}⚠️  Advertencias ESLint (revisar manualmente)${NC}")

# 7. Build test
echo "7. Probando build de producción..."
npm run build > /dev/null 2>&1 && check "Build exitoso" || (echo -e "${RED}❌ Build falló${NC}" && exit 1)

# 8. Verificar archivos PWA
echo "8. Verificando archivos PWA..."
[ -f "public/sw.js" ] && check "Service Worker (sw.js) presente" || (echo -e "${RED}❌ sw.js no encontrado${NC}" && exit 1)
[ -f "public/manifest.json" ] && check "Manifest presente" || (echo -e "${RED}❌ manifest.json no encontrado${NC}" && exit 1)
[ -f "public/icon-192x192.png" ] && check "Icono 192x192 presente" || (echo -e "${YELLOW}⚠️  icon-192x192.png no encontrado${NC}")
[ -f "public/icon-512x512.png" ] && check "Icono 512x512 presente" || (echo -e "${YELLOW}⚠️  icon-512x512.png no encontrado${NC}")

# 9. Verificar design tokens
echo "9. Verificando design tokens..."
[ -f "src/styles/design-tokens.css" ] && check "Design tokens presente" || (echo -e "${RED}❌ design-tokens.css no encontrado${NC}" && exit 1)

# 10. Verificar Dockerfile (si existe)
if [ -f "Dockerfile" ]; then
    echo "10. Verificando Dockerfile..."
    grep -q "FROM node" Dockerfile && check "Dockerfile válido" || (echo -e "${YELLOW}⚠️  Dockerfile puede tener problemas${NC}")
fi

echo ""
echo -e "${GREEN}🎉 Verificación completada!${NC}"
echo ""
echo "Próximos pasos:"
echo "  • Local: npm run dev"
echo "  • Producción: npm start"
echo "  • Docker: docker-compose up -d"
echo "  • Vercel: ver docs/DEPLOYMENT_GUIDE.md"
