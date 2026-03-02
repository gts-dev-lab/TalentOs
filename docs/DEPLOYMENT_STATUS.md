# Estado del Despliegue - TalentOS

**Última actualización:** 21 de enero de 2026

---

## 📍 Estado Actual

### Verificación Local

- **Puerto 3000:** No está activo actualmente
- **Proceso Node.js:** No se detecta servidor Next.js corriendo
- **Estado:** La aplicación **NO está desplegada localmente** en este momento

---

## 🚀 Opciones de Despliegue Disponibles

### 1. **Despliegue Local (Desarrollo)**

Para iniciar la aplicación localmente:

```bash
cd ~/Documentos/00_Organizacion/01_Proyectos/01_Apps/2_Aplicaciones_Gestion/saas_formacion/TalentOs

# Instalar dependencias (si no están instaladas)
npm install --legacy-peer-deps

# Iniciar servidor de desarrollo
npm run dev
```

**URL:** http://localhost:3000

---

### 2. **Despliegue en Vercel (Recomendado para Producción)**

**Ventajas:**

- ✅ Despliegue automático desde Git
- ✅ HTTPS incluido
- ✅ CDN global
- ✅ Escalado automático
- ✅ Gratis para proyectos pequeños

**Pasos:**

1. **Push a Git:**

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. **En Vercel:**
   - Ir a: https://vercel.com
   - **New Project** → Importar tu repo
   - Configurar variables de entorno (ver `.env.production.example`)
   - Click **Deploy**

**Variables de entorno requeridas:**

```
JWT_SECRET=tu-secret-generado
NEXTAUTH_URL=https://tu-proyecto.vercel.app
NEXTAUTH_SECRET=tu-secret-generado
```

---

### 3. **Despliegue con Docker**

**Para producción local o servidor:**

```bash
# Crear .env.production
cp .env.local .env.production
# Editar NEXTAUTH_URL con tu dominio

# Build y ejecutar
docker-compose build
docker-compose up -d

# Ver logs
docker-compose logs -f
```

**URL:** http://localhost:3000 (o tu dominio configurado)

---

### 4. **Despliegue en Servidor Linux**

**Con PM2 + Nginx:**

```bash
# En el servidor
cd /var/www/talentos

# Instalar dependencias
npm install --production --legacy-peer-deps

# Build
npm run build

# Iniciar con PM2
pm2 start npm --name "talentos" -- start
pm2 save
pm2 startup
```

**Configurar Nginx** (ver `docs/DEPLOYMENT_GUIDE.md`)

---

## ✅ Checklist Pre-Despliegue

Antes de desplegar, verifica:

- [ ] Variables de entorno configuradas (`.env.local` o `.env.production`)
- [ ] `JWT_SECRET` generado (mínimo 32 caracteres)
- [ ] `NEXTAUTH_SECRET` generado (si usas SSO)
- [ ] `npm run build` compila sin errores
- [ ] `npm run lint` sin errores críticos
- [ ] Base de datos inicializada (se crea automáticamente en IndexedDB)
- [ ] PWA manifest configurado (`public/manifest.json`)
- [ ] Service Worker funcionando (`public/sw.js`)

---

## 🔍 Verificación Post-Despliegue

Después de desplegar, verifica:

1. **Acceso a la aplicación:**
   - [ ] La página carga correctamente
   - [ ] No hay errores en la consola del navegador
   - [ ] El favicon se muestra correctamente

2. **Autenticación:**
   - [ ] Login funciona (`elena.vargas@example.com` / `password123`)
   - [ ] Registro de nuevos usuarios funciona
   - [ ] Logout funciona correctamente

3. **Funcionalidades principales:**
   - [ ] Dashboard carga con datos
   - [ ] Sidebar y topbar se muestran correctamente
   - [ ] Navegación entre páginas funciona
   - [ ] PWA: Service Worker registrado (DevTools → Application)

4. **Rendimiento:**
   - [ ] Páginas cargan rápidamente
   - [ ] No hay errores 500 en el servidor
   - [ ] Las imágenes y assets se cargan correctamente

---

## 📝 Variables de Entorno Requeridas

### Mínimas (para funcionamiento básico):

```env
JWT_SECRET=tu-secret-generado
NEXTAUTH_URL=https://tu-dominio.com
NEXTAUTH_SECRET=tu-secret-generado
```

### Opcionales (para funcionalidades avanzadas):

```env
# Supabase (sincronización en la nube)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# IA (Gemini)
GOOGLE_API_KEY=tu-api-key

# Notificaciones Email
RESEND_API_KEY=tu-resend-key

# Notificaciones WhatsApp
TWILIO_ACCOUNT_SID=tu-sid
TWILIO_AUTH_TOKEN=tu-token

# Authentik SSO
AUTHENTIK_ISSUER=https://authentik.tu-dominio.com
AUTHENTIK_ID=tu-client-id
AUTHENTIK_SECRET=tu-client-secret
NEXT_PUBLIC_AUTHENTIK_ENABLED=true
```

---

## 🐛 Troubleshooting

### La aplicación no inicia

1. **Verificar Node.js:**

```bash
node --version  # Debe ser >= 18
```

2. **Verificar dependencias:**

```bash
npm install --legacy-peer-deps
```

3. **Verificar build:**

```bash
npm run build
```

### Error de puerto en uso

```bash
# Ver qué está usando el puerto 3000
lsof -i :3000

# O cambiar el puerto
PORT=3001 npm run dev
```

### Error de variables de entorno

- Verificar que `.env.local` existe
- Verificar que `JWT_SECRET` tiene al menos 32 caracteres
- En producción, verificar que las variables están configuradas en la plataforma

---

## 📚 Documentación Relacionada

- **Guía completa:** `docs/DEPLOYMENT_GUIDE.md`
- **Guía rápida:** `docs/QUICK_DEPLOY.md`
- **Resumen ejecutivo:** `DEPLOY.md`
- **Script de verificación:** `scripts/verify-build.sh`

---

## 🔄 Próximos Pasos

1. **Si quieres desplegar localmente:**

   ```bash
   npm run dev
   ```

2. **Si quieres desplegar en producción:**
   - Revisa `docs/DEPLOYMENT_GUIDE.md`
   - Elige plataforma (Vercel recomendado)
   - Configura variables de entorno
   - Haz deploy

3. **Si ya está desplegada en otro lugar:**
   - Comparte la URL para verificar
   - Revisa logs del servidor
   - Verifica variables de entorno

---

**¿Necesitas ayuda?** Revisa la documentación en `docs/` o ejecuta `./scripts/verify-build.sh` para diagnóstico.
