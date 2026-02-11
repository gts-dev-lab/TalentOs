# Authentik - Inicio Rápido (5 minutos)

## 🚀 Instalación Express

### 1. Crear directorio y secretos

```bash
# Ir al directorio del proyecto
cd ~/Documentos/00_Organizacion/01_Proyectos/01_Apps/2_Aplicaciones_Gestion/saas_formacion/TalentOs

# Copiar ejemplo de variables de entorno
cp authentik.env.example .env.authentik

# Generar secretos automáticamente
echo "AUTHENTIK_SECRET_KEY=$(openssl rand -base64 60)" > .env.authentik
echo "PG_PASS=$(openssl rand -base64 36)" >> .env.authentik
echo "AUTHENTIK_URL=http://localhost:9000" >> .env.authentik
echo "AUTHENTIK_PORT_HTTP=9000" >> .env.authentik
echo "AUTHENTIK_PORT_HTTPS=9443" >> .env.authentik
echo "AUTHENTIK_LOG_LEVEL=info" >> .env.authentik
echo "AUTHENTIK_ERROR_REPORTING=false" >> .env.authentik
```

### 2. Iniciar Authentik

```bash
# Usar el docker-compose que ya está en el proyecto
docker-compose -f docker-compose.authentik.yml --env-file .env.authentik up -d

# Ver logs para confirmar que inició correctamente
docker-compose -f docker-compose.authentik.yml logs -f
```

Esperar ~30-60 segundos hasta ver:
```
authentik_server | Successfully booted authentik
```

Presionar `Ctrl+C` para salir de los logs.

### 3. Configuración Inicial

1. Abrir: http://localhost:9000
2. Primera vez → Asistente de configuración
3. Crear admin:
   - Email: `admin@tuempresa.com`
   - Username: `akadmin`
   - Password: `Admin123!` (cambiar después)

¡Listo! Authentik está corriendo.

---

## 🔑 Configurar Google OAuth (10 minutos)

### En Google Cloud Console

1. https://console.cloud.google.com/
2. Crear proyecto: "TalentOS SSO"
3. **APIs & Services** > **OAuth consent screen**:
   - Tipo: Interno o Externo
   - Nombre: TalentOS
   - Scopes: `userinfo.email`, `userinfo.profile`
4. **Credentials** > **Create OAuth 2.0 Client ID**:
   - Tipo: Web application
   - Redirect URI: `http://localhost:9000/source/oauth/callback/google/`
   - Copiar: Client ID y Client Secret

### En Authentik

1. Login → **Admin interface**
2. **Directory** > **Federation & Social login**
3. **Create** > **Google**
4. Pegar Client ID y Secret
5. Scope: `openid email profile`
6. **Save**

✅ Logout → Ver botón "Continue with Google"

---

## 🔷 Configurar Microsoft OAuth (10 minutos)

### En Azure Portal

1. https://portal.azure.com/
2. **Azure AD** > **App registrations** > **New registration**
3. Nombre: TalentOS SSO
4. Redirect URI: `http://localhost:9000/source/oauth/callback/microsoft/`
5. Copiar: Application (client) ID
6. **Certificates & secrets** > **New client secret**
7. Copiar: Secret Value
8. **API permissions** > **Add**: `User.Read`, `email`, `profile`, `openid`

### En Authentik

1. **Directory** > **Federation & Social login**
2. **Create** > **Microsoft**
3. Pegar Client ID y Secret
4. Additional settings: `{"tenant": "common"}`
5. **Save**

✅ Logout → Ver botón "Continue with Microsoft"

---

## 🔗 Conectar con TalentOS (15 minutos)

### 1. Instalar NextAuth.js

```bash
cd ~/Documentos/00_Organizacion/01_Proyectos/01_Apps/2_Aplicaciones_Gestion/saas_formacion/TalentOs
npm install next-auth
```

### 2. Crear Provider en Authentik

1. **Applications** > **Providers** > **Create**
2. Tipo: **OAuth2/OpenID Provider**
3. Name: `TalentOS Provider`
4. Client ID: `talentos-client`
5. Redirect URIs: `http://localhost:3000/api/auth/callback/authentik`
6. **Save** → Copiar Client Secret

### 3. Crear Application en Authentik

1. **Applications** > **Applications** > **Create**
2. Name: `TalentOS`
3. Slug: `talentos`
4. Provider: Seleccionar `TalentOS Provider`
5. **Save**

### 4. Configurar Variables de Entorno

Añadir a `.env.local`:

```bash
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Authentik
AUTHENTIK_ID=talentos-client
AUTHENTIK_SECRET=el-client-secret-copiado-del-paso-2
AUTHENTIK_ISSUER=http://localhost:9000/application/o/talentos/
```

### 5. Crear archivos necesarios

Ver: `docs/AUTHENTIK_SETUP.md` secciones "Paso 6 a 10" para código completo.

Archivos a crear:
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/types/next-auth.d.ts`
- `src/app/auth/signin/page.tsx`
- `src/app/auth/error/page.tsx`
- `src/middleware.ts`

---

## ✅ Verificar Funcionamiento

1. Reiniciar Next.js: `npm run dev`
2. Abrir: http://localhost:3000/auth/signin
3. Ver botones: Google, Microsoft, Authentik
4. Click Google → Login → Redirigido a `/dashboard`
5. ✅ ¡Funciona!

---

## 🛑 Detener/Reiniciar

```bash
# Detener Authentik
docker-compose -f docker-compose.authentik.yml down

# Reiniciar (conserva datos)
docker-compose -f docker-compose.authentik.yml --env-file .env.authentik up -d

# Ver logs
docker-compose -f docker-compose.authentik.yml logs -f

# Eliminar TODO (incluyendo datos)
docker-compose -f docker-compose.authentik.yml down -v
```

---

## 📚 Documentación Completa

- **Setup detallado**: `docs/AUTHENTIK_SETUP.md` (~100 líneas)
- **Comparación proveedores**: `docs/AUTH_PROVIDERS_GUIDE.md`
- **Cuentas demo**: `docs/DEMO_ACCOUNTS.md`

---

## 🆘 Ayuda Rápida

**Problema**: Puerto 9000 ocupado
```bash
sudo lsof -i :9000
# Detener el proceso o cambiar puerto en .env.authentik
```

**Problema**: No inicia PostgreSQL
```bash
docker-compose -f docker-compose.authentik.yml logs postgresql
# Verificar que PG_PASS esté configurado en .env.authentik
```

**Problema**: Redirect URI mismatch
- Verificar URIs exactas (incluir `/` final)
- Deben coincidir en Google/Microsoft/Authentik

---

**Tiempo total**: ~30-40 minutos  
**Siguiente paso**: Ver `docs/AUTHENTIK_SETUP.md` para guía completa
