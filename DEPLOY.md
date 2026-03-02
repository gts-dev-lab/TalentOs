# 🚀 Deployment Rápido - TalentOS

## ⚡ Opción A: Probar en Local (2 minutos)

```bash
cd ~/Documentos/00_Organizacion/01_Proyectos/01_Apps/2_Aplicaciones_Gestion/saas_formacion/TalentOs

# Verificar que todo está listo
npm install --legacy-peer-deps

# Iniciar servidor de desarrollo
npm run dev
```

**Abrir**: http://localhost:3000  
**Login**: `elena.vargas@example.com` / `password123`

---

## 🌐 Opción B: Deploy en Vercel (5 minutos)

### 1. Push a Git

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Vercel

- Ir a: https://vercel.com
- **New Project** → Importar tu repo
- Variables de entorno:
  ```
  JWT_SECRET=generar-con-openssl-rand-base64-32
  NEXTAUTH_URL=https://tu-proyecto.vercel.app
  NEXTAUTH_SECRET=generar-con-openssl-rand-base64-32
  ```
- **Deploy**

✅ **Listo**: `https://tu-proyecto.vercel.app`

---

## 🐳 Opción C: Deploy con Docker

```bash
# 1. Crear .env.production
cp .env.local .env.production
# Editar: NEXTAUTH_URL=https://tu-dominio.com

# 2. Build y ejecutar
docker-compose build
docker-compose up -d

# 3. Verificar
docker-compose logs -f
```

✅ **Listo**: http://localhost:3000

---

## 📚 Documentación Completa

- **Guía completa**: `docs/DEPLOYMENT_GUIDE.md`
- **Guía rápida**: `docs/QUICK_DEPLOY.md`
- **Verificación**: `./scripts/verify-build.sh`

---

## ✅ Verificación Rápida

```bash
# Build de prueba
npm run build

# Si funciona, estás listo para deploy
```

---

**Recomendación**: Empezar con **Opción A** (local) para verificar, luego **Opción B** (Vercel) para producción.
