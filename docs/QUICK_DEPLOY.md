# Guía Rápida de Deployment - TalentOS

**Tiempo estimado**: 5-10 minutos

---

## 🚀 Opción 1: Probar en Local (RÁPIDO)

### Paso 1: Verificar

```bash
cd ~/Documentos/00_Organizacion/01_Proyectos/01_Apps/2_Aplicaciones_Gestion/saas_formacion/TalentOs

# Ejecutar script de verificación
./scripts/verify-build.sh

# O manualmente:
npm install --legacy-peer-deps
npm run build
```

### Paso 2: Iniciar

```bash
# Desarrollo (hot reload)
npm run dev

# O producción local
npm run build
npm start
```

### Paso 3: Abrir

```
http://localhost:3000
```

**Login**: `elena.vargas@example.com` / `password123`

---

## 🌐 Opción 2: Deploy en Vercel (MÁS FÁCIL)

### Paso 1: Push a Git

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Paso 2: Vercel

1. Ir a: https://vercel.com
2. **New Project** → Importar repo
3. Configurar variables de entorno:
   ```
   JWT_SECRET=generar-con-openssl-rand-base64-32
   NEXTAUTH_URL=https://tu-proyecto.vercel.app
   NEXTAUTH_SECRET=generar-con-openssl-rand-base64-32
   ```
4. Click **Deploy**

### Paso 3: Listo

Tu app estará en: `https://tu-proyecto.vercel.app`

---

## 🐳 Opción 3: Deploy con Docker

### Paso 1: Preparar

```bash
# Crear .env.production
cp .env.local .env.production

# Editar .env.production:
# - NEXTAUTH_URL=https://tu-dominio.com
# - NODE_ENV=production
```

### Paso 2: Build y Run

```bash
# Build
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
# Verificar container
docker ps

# Ver logs
docker-compose logs talentos

# Acceder
curl http://localhost:3000
```

---

## 🐧 Opción 4: Servidor Linux

### Paso 1: Subir archivos

```bash
# Desde tu máquina local
scp -r . usuario@servidor:/var/www/talentos
```

### Paso 2: En el servidor

```bash
ssh usuario@servidor
cd /var/www/talentos

# Instalar dependencias
npm install --production --legacy-peer-deps

# Build
npm run build

# Iniciar con PM2
pm2 start npm --name "talentos" -- start
pm2 save
```

### Paso 3: Nginx (opcional)

Ver `docs/DEPLOYMENT_GUIDE.md` sección "Deployment en Servidor Linux"

---

## ✅ Checklist Rápido

- [ ] `npm run build` funciona
- [ ] `.env.local` tiene JWT_SECRET
- [ ] Login funciona con cuenta demo
- [ ] Sidebar oscuro visible
- [ ] PWA: Service Worker registrado

---

## 🆘 Problemas Comunes

### Build falla

```bash
# Limpiar y reinstalar
rm -rf node_modules .next
npm install --legacy-peer-deps
npm run build
```

### Puerto ocupado

```bash
# Cambiar puerto en .env.local
PORT=3001
```

### Service Worker no funciona

```bash
# Verificar que public/sw.js existe
ls -la public/sw.js

# Hard refresh en navegador (Ctrl+Shift+R)
```

---

**Para más detalles**: Ver `docs/DEPLOYMENT_GUIDE.md`
