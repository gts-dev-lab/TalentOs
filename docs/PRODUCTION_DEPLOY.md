# 🚀 Guía de Despliegue en Producción - TalentOS

**Última actualización:** 21 de enero de 2026

---

## 📋 Índice

1. [Preparación](#preparación)
2. [Opción 1: Vercel (Recomendado)](#opción-1-vercel-recomendado)
3. [Opción 2: Docker](#opción-2-docker)
4. [Opción 3: Servidor Linux](#opción-3-servidor-linux)
5. [Verificación Post-Despliegue](#verificación-post-despliegue)
6. [Troubleshooting](#troubleshooting)

---

## 🔧 Preparación

### Paso 1: Generar Secrets

Ejecuta el script de preparación:

```bash
cd ~/Documentos/00_Organizacion/01_Proyectos/01_Apps/2_Aplicaciones_Gestion/saas_formacion/TalentOs
./scripts/prepare-production.sh
```

Este script generará:

- `JWT_SECRET` - Para firmar tokens de sesión
- `NEXTAUTH_SECRET` - Para NextAuth.js (SSO)

**⚠️ IMPORTANTE:** Guarda estos secrets en un lugar seguro. Los necesitarás para configurar las variables de entorno.

### Paso 2: Verificar Build

```bash
# Verificar que compila sin errores
npm run build

# Si hay errores, corregirlos antes de desplegar
npm run lint
npm run typecheck
```

### Paso 3: Verificar Git

```bash
# Asegúrate de que todo está commiteado
git status

# Si hay cambios sin commitear:
git add .
git commit -m "Ready for production deployment"
```

---

## 🌐 Opción 1: Vercel (Recomendado)

**Ventajas:**

- ✅ Despliegue automático desde Git
- ✅ HTTPS incluido
- ✅ CDN global
- ✅ Escalado automático
- ✅ Plan gratuito generoso

### Paso 1: Crear Cuenta en Vercel

1. Ir a: https://vercel.com
2. Crear cuenta (puedes usar GitHub/GitLab)
3. Conectar tu repositorio

### Paso 2: Importar Proyecto

1. Click en **"New Project"**
2. Selecciona tu repositorio de TalentOS
3. Vercel detectará automáticamente que es Next.js

### Paso 3: Configurar Variables de Entorno

En la sección **"Environment Variables"**, añade:

#### Variables Requeridas:

```
JWT_SECRET=VzXD7Z0VL/fpOfGdFXdZQn/8ugkGeC/bUQ5Wf97Exc0=
NEXTAUTH_SECRET=<generar-con-openssl-rand-base64-32>
NEXTAUTH_URL=https://tu-proyecto.vercel.app
NODE_ENV=production
```

**Nota:** Reemplaza `tu-proyecto.vercel.app` con la URL que Vercel te asigne.

#### Variables Opcionales (si las usas):

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# IA
GOOGLE_API_KEY=tu-api-key

# Notificaciones
RESEND_API_KEY=tu-resend-key
TWILIO_ACCOUNT_SID=tu-sid
TWILIO_AUTH_TOKEN=tu-token

# Authentik SSO
AUTHENTIK_ISSUER=https://auth.tu-dominio.com
AUTHENTIK_ID=tu-client-id
AUTHENTIK_SECRET=tu-client-secret
NEXT_PUBLIC_AUTHENTIK_ENABLED=true
```

### Paso 4: Configurar Build Settings

Vercel debería detectar automáticamente:

- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install --legacy-peer-deps`

Si no, configúralo manualmente.

### Paso 5: Deploy

1. Click en **"Deploy"**
2. Espera a que termine el build (2-5 minutos)
3. Tu app estará disponible en: `https://tu-proyecto.vercel.app`

### Paso 6: Actualizar NEXTAUTH_URL

Después del primer deploy, actualiza `NEXTAUTH_URL` en Vercel con la URL real:

```
NEXTAUTH_URL=https://tu-proyecto-real.vercel.app
```

Y haz un nuevo deploy.

---

## 🐳 Opción 2: Docker

### Paso 1: Crear .env.production

```bash
cp .env.production.example .env.production
```

Edita `.env.production` y configura:

```env
NODE_ENV=production
JWT_SECRET=tu-jwt-secret-generado
NEXTAUTH_URL=https://tu-dominio.com
NEXTAUTH_SECRET=tu-nextauth-secret-generado
```

### Paso 2: Build y Ejecutar

```bash
# Build de la imagen
docker-compose build

# O build manual
DOCKER_BUILD=true docker build -t talentos:latest .

# Ejecutar
docker-compose up -d

# Ver logs
docker-compose logs -f
```

### Paso 3: Verificar

```bash
# Verificar que el container está corriendo
docker ps

# Ver logs
docker-compose logs talentos

# Acceder
curl http://localhost:3000
```

### Paso 4: Configurar Nginx (Opcional)

Si quieres usar un dominio personalizado, configura Nginx como reverse proxy:

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🐧 Opción 3: Servidor Linux

### Paso 1: Preparar Servidor

```bash
# Conectar al servidor
ssh usuario@tu-servidor.com

# Instalar Node.js 18+ si no está instalado
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2
sudo npm install -g pm2
```

### Paso 2: Subir Código

```bash
# Desde tu máquina local
cd ~/Documentos/00_Organizacion/01_Proyectos/01_Apps/2_Aplicaciones_Gestion/saas_formacion/TalentOs

# Subir archivos (excluyendo node_modules)
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' . usuario@servidor:/var/www/talentos
```

### Paso 3: En el Servidor

```bash
ssh usuario@servidor
cd /var/www/talentos

# Instalar dependencias
npm install --production --legacy-peer-deps

# Crear .env.production
nano .env.production
# Pegar las variables de entorno

# Build
npm run build

# Iniciar con PM2
pm2 start npm --name "talentos" -- start
pm2 save
pm2 startup
```

### Paso 4: Configurar Nginx

```bash
sudo nano /etc/nginx/sites-available/talentos
```

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

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
}
```

```bash
# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/talentos /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Paso 5: Configurar SSL (Let's Encrypt)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com
```

---

## ✅ Verificación Post-Despliegue

### Checklist Básico

- [ ] La aplicación carga correctamente
- [ ] No hay errores en la consola del navegador
- [ ] Login funciona (`elena.vargas@example.com` / `password123`)
- [ ] Dashboard muestra datos
- [ ] Sidebar y topbar se muestran correctamente
- [ ] Navegación entre páginas funciona
- [ ] PWA: Service Worker registrado (DevTools → Application)
- [ ] HTTPS funciona (si configuraste dominio)

### Verificación de Variables de Entorno

```bash
# En Vercel: Settings → Environment Variables
# En Docker: docker-compose exec talentos env | grep JWT
# En Linux: pm2 env 0 | grep JWT
```

Verifica que todas las variables requeridas estén configuradas.

---

## 🐛 Troubleshooting

### Error: "JWT_SECRET is not defined"

**Solución:** Configura `JWT_SECRET` en las variables de entorno de tu plataforma.

### Error: "NEXTAUTH_URL is not set"

**Solución:** Configura `NEXTAUTH_URL` con la URL completa de tu aplicación (ej: `https://tu-proyecto.vercel.app`).

### Error: Build falla en Vercel

**Posibles causas:**

1. Dependencias no instaladas → Verifica `package.json`
2. Errores TypeScript → Ejecuta `npm run typecheck` localmente
3. Errores ESLint → Ejecuta `npm run lint` localmente

**Solución:** Corrige los errores localmente antes de hacer push.

### Error: La aplicación no carga después del deploy

**Verificar:**

1. Logs del servidor (Vercel: Deployments → View Function Logs)
2. Variables de entorno configuradas correctamente
3. `NEXTAUTH_URL` coincide con la URL real

### Error: Service Worker no se registra

**Solución:** Verifica que `public/sw.js` existe y que `NEXTAUTH_URL` está configurado correctamente.

---

## 📚 Archivos de Configuración

- **Vercel:** `vercel.json`
- **Docker:** `Dockerfile`, `docker-compose.yml`
- **Variables de entorno:** `.env.production.example`
- **Next.js:** `next.config.ts`

---

## 🔄 Actualizaciones Futuras

Para actualizar la aplicación después del despliegue:

### Vercel:

- Simplemente haz `git push` → Deploy automático

### Docker:

```bash
git pull
docker-compose build
docker-compose up -d
```

### Linux:

```bash
git pull
npm install --production --legacy-peer-deps
npm run build
pm2 restart talentos
```

---

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs del servidor
2. Verifica las variables de entorno
3. Consulta `docs/DEPLOYMENT_GUIDE.md` para más detalles
4. Ejecuta `./scripts/verify-build.sh` para diagnóstico

---

**¡Listo para producción! 🎉**
