# Guía de Deployment - TalentOS

**Fecha**: 25 de enero de 2026  
**Versión**: 1.0

---

## 📋 Índice

1. [Prueba Local](#prueba-local)
2. [Deployment en Vercel](#deployment-en-vercel)
3. [Deployment con Docker](#deployment-con-docker)
4. [Deployment en Servidor Linux](#deployment-en-servidor-linux)
5. [Firebase App Hosting](#firebase-app-hosting)
6. [Troubleshooting](#troubleshooting)

---

## 🏠 Prueba Local

### Paso 1: Verificar Dependencias

```bash
cd ~/Documentos/00_Organizacion/01_Proyectos/01_Apps/2_Aplicaciones_Gestion/saas_formacion/TalentOs

# Verificar Node.js (requiere >= 18)
node --version

# Verificar npm
npm --version
```

### Paso 2: Instalar Dependencias

```bash
# Instalar todas las dependencias
npm install

# Si hay problemas, usar:
npm install --legacy-peer-deps
```

### Paso 3: Verificar Variables de Entorno

```bash
# Verificar que .env.local existe y tiene JWT_SECRET
cat .env.local | grep JWT_SECRET

# Si falta, generar uno nuevo:
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env.local
```

### Paso 4: Build de Prueba

```bash
# Build de producción (verifica errores)
npm run build

# Si hay errores TypeScript:
npm run typecheck

# Si hay errores ESLint:
npm run lint
```

### Paso 5: Iniciar Servidor de Desarrollo

```bash
# Modo desarrollo (hot reload)
npm run dev

# Abrir en navegador:
# http://localhost:3000
```

### Paso 6: Probar Producción Local

```bash
# Build
npm run build

# Iniciar servidor de producción
npm start

# Abrir en navegador:
# http://localhost:3000
```

### ✅ Checklist Local

- [ ] `npm install` sin errores
- [ ] `npm run build` compila correctamente
- [ ] `npm run dev` inicia sin errores
- [ ] Login funciona (usar cuenta demo)
- [ ] Sidebar oscuro visible
- [ ] Topbar claro visible
- [ ] Cards tienen sombras Frappe
- [ ] Tablas tienen estilo Frappe
- [ ] PWA: Service Worker registrado (DevTools → Application)

---

## 🚀 Deployment en Vercel (Recomendado)

### Ventajas
- ✅ Gratis para proyectos personales
- ✅ Deploy automático desde Git
- ✅ SSL automático
- ✅ CDN global
- ✅ Optimizado para Next.js

### Paso 1: Preparar Repositorio

```bash
# Asegurar que .env.local NO está en Git (ya está en .gitignore)
git status

# Commit de cambios
git add .
git commit -m "Implementación Frappe HRMS UI + PWA"

# Push a GitHub/GitLab/Bitbucket
git push origin main
```

### Paso 2: Crear Proyecto en Vercel

1. Ir a: https://vercel.com
2. Sign in con GitHub/GitLab
3. **New Project** → Importar repositorio
4. Configurar:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (raíz)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next` (automático)

### Paso 3: Variables de Entorno en Vercel

En **Settings** → **Environment Variables**, añadir:

```env
# REQUERIDO
JWT_SECRET=tu-secret-generado-con-openssl-rand-base64-32
NEXTAUTH_URL=https://tu-proyecto.vercel.app
NEXTAUTH_SECRET=tu-secret-generado-con-openssl-rand-base64-32

# OPCIONALES
NODE_ENV=production
NEXT_PUBLIC_AUTHENTIK_ENABLED=false

# Si usas Supabase
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Si usas notificaciones
# RESEND_API_KEY=...
# TWILIO_ACCOUNT_SID=...
# TWILIO_AUTH_TOKEN=...
```

### Paso 4: Deploy

1. Click **Deploy**
2. Esperar build (2-5 minutos)
3. Verificar URL: `https://tu-proyecto.vercel.app`

### Paso 5: Verificar Deployment

- ✅ App carga correctamente
- ✅ Login funciona
- ✅ PWA: Service Worker registrado
- ✅ Manifest cargado
- ✅ Estilos Frappe aplicados

### Configuración Avanzada Vercel

Crear `vercel.json` (opcional):

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

---

## 🐳 Deployment con Docker

### Ventajas
- ✅ Portabilidad total
- ✅ Aislamiento de dependencias
- ✅ Fácil escalado
- ✅ Funciona en cualquier servidor

### Paso 1: Crear Dockerfile

Crear `Dockerfile`:

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY .npmrc* ./

# Instalar dependencias
RUN npm ci --legacy-peer-deps

# Copiar código fuente
COPY . .

# Build de producción
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Crear usuario no-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar archivos necesarios
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Cambiar ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### Paso 2: Configurar Next.js para Standalone

Actualizar `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  output: 'standalone', // Añadir esto
  // ... resto de config
};
```

### Paso 3: Crear docker-compose.yml

Crear `docker-compose.yml`:

```yaml
version: '3.8'

services:
  talentos:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL:-http://localhost:3000}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    env_file:
      - .env.production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Paso 4: Crear .env.production

```bash
# Copiar .env.local y adaptar para producción
cp .env.local .env.production

# Editar .env.production:
# - Cambiar NEXTAUTH_URL a tu dominio
# - Cambiar NODE_ENV=production
# - Añadir todas las variables necesarias
```

### Paso 5: Build y Run

```bash
# Build de imagen
docker build -t talentos:latest .

# O con docker-compose
docker-compose build

# Ejecutar
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener
docker-compose down
```

### Paso 6: Verificar

- ✅ Container corriendo: `docker ps`
- ✅ App accesible: `http://localhost:3000`
- ✅ Logs sin errores: `docker-compose logs`

---

## 🐧 Deployment en Servidor Linux

### Requisitos
- Ubuntu/Debian 20.04+
- Node.js 20+
- Nginx (opcional, para reverse proxy)
- PM2 (para gestión de procesos)

### Paso 1: Preparar Servidor

```bash
# SSH al servidor
ssh usuario@tu-servidor.com

# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2
sudo npm install -g pm2

# Instalar Nginx (opcional)
sudo apt install -y nginx
```

### Paso 2: Clonar Repositorio

```bash
# Crear directorio
sudo mkdir -p /var/www/talentos
sudo chown $USER:$USER /var/www/talentos

# Clonar repo (o subir archivos)
cd /var/www/talentos
git clone https://github.com/tu-usuario/talentos.git .

# O subir archivos con scp:
# scp -r . usuario@servidor:/var/www/talentos
```

### Paso 3: Configurar Variables de Entorno

```bash
cd /var/www/talentos

# Crear .env.production
nano .env.production
```

Contenido mínimo:

```env
NODE_ENV=production
JWT_SECRET=generar-con-openssl-rand-base64-32
NEXTAUTH_URL=https://tu-dominio.com
NEXTAUTH_SECRET=generar-con-openssl-rand-base64-32
```

### Paso 4: Build y Start

```bash
# Instalar dependencias
npm install --production --legacy-peer-deps

# Build
npm run build

# Iniciar con PM2
pm2 start npm --name "talentos" -- start

# Guardar configuración PM2
pm2 save
pm2 startup

# Ver estado
pm2 status
pm2 logs talentos
```

### Paso 5: Configurar Nginx (Reverse Proxy)

Crear `/etc/nginx/sites-available/talentos`:

```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tu-dominio.com www.tu-dominio.com;

    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/tu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tu-dominio.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Cache static assets
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }
}
```

Activar:

```bash
sudo ln -s /etc/nginx/sites-available/talentos /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Paso 6: SSL con Let's Encrypt

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com

# Auto-renovación
sudo certbot renew --dry-run
```

### Paso 7: Firewall

```bash
# Permitir puertos
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 🔥 Firebase App Hosting

Ya tienes `apphosting.yaml` configurado.

### Paso 1: Instalar Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### Paso 2: Inicializar Firebase

```bash
cd /ruta/a/TalentOs
firebase init apphosting
```

### Paso 3: Configurar Variables

En Firebase Console → App Hosting → Variables de Entorno:

```env
JWT_SECRET=...
NEXTAUTH_URL=https://tu-app.firebaseapp.com
NEXTAUTH_SECRET=...
```

### Paso 4: Deploy

```bash
firebase deploy --only apphosting
```

---

## 🔧 Troubleshooting

### Error: "Module not found"

```bash
# Limpiar e instalar de nuevo
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Error: "JWT_SECRET not configured"

```bash
# Verificar .env.local existe
cat .env.local

# Generar nuevo secret
openssl rand -base64 32
# Añadir a .env.local: JWT_SECRET=...
```

### Error: "Port 3000 already in use"

```bash
# Ver qué proceso usa el puerto
lsof -i :3000

# Matar proceso
kill -9 <PID>

# O cambiar puerto en .env.local:
# PORT=3001
```

### Error: Build falla en producción

```bash
# Verificar TypeScript
npm run typecheck

# Verificar ESLint
npm run lint

# Build con más información
npm run build -- --debug
```

### Service Worker no se registra

1. Verificar que `public/sw.js` existe
2. Abrir DevTools → Application → Service Workers
3. Click "Unregister" si hay uno antiguo
4. Hard refresh (Ctrl+Shift+R)

### Estilos Frappe no se aplican

1. Verificar que `src/styles/design-tokens.css` existe
2. Verificar que `globals.css` importa design-tokens
3. Limpiar cache: `rm -rf .next`
4. Rebuild: `npm run build`

---

## 📊 Comparación de Opciones

| Opción | Dificultad | Costo | Escalado | SSL | Recomendado para |
|--------|------------|-------|----------|-----|------------------|
| **Vercel** | ⭐ Fácil | Gratis/$$ | Automático | ✅ | Proyectos pequeños/medianos |
| **Docker** | ⭐⭐ Media | Servidor | Manual | Manual | Servidor propio, CI/CD |
| **Linux + PM2** | ⭐⭐⭐ Media | Servidor | Manual | Manual | VPS dedicado |
| **Firebase** | ⭐⭐ Media | Gratis/$$ | Automático | ✅ | Proyectos Firebase |

---

## ✅ Checklist Pre-Deployment

- [ ] `npm run build` compila sin errores
- [ ] `npm run typecheck` sin errores
- [ ] `npm run lint` sin errores críticos
- [ ] Variables de entorno configuradas
- [ ] `.env.local` NO está en Git
- [ ] Service Worker funciona (`public/sw.js`)
- [ ] Manifest correcto (`public/manifest.json`)
- [ ] Iconos PWA presentes (`public/icon-*.png`)
- [ ] Login funciona con cuentas demo
- [ ] Estilos Frappe visibles

---

## 🚀 Recomendación

**Para empezar rápido**: **Vercel** (5 minutos)
- Gratis
- Deploy automático
- SSL incluido
- Perfecto para Next.js

**Para producción empresarial**: **Docker + Servidor Linux**
- Control total
- Escalable
- Aislamiento
- Portabilidad

---

**Última actualización**: 25 de enero de 2026
