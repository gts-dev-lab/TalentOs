# Guía Completa: Authentik SSO con Google y Microsoft

**Para**: TalentOS - Entorno Empresarial  
**Proveedores**: Google OAuth + Microsoft/Outlook OAuth  
**Dificultad**: ⭐⭐☆☆☆ (Fácil-Media)  
**Tiempo estimado**: 30-45 minutos

---

## 📋 Índice

1. [¿Por qué Authentik?](#por-qué-authentik)
2. [Requisitos](#requisitos)
3. [Instalación con Docker](#instalación-con-docker)
4. [Configurar Google OAuth](#configurar-google-oauth)
5. [Configurar Microsoft OAuth](#configurar-microsoft-oauth)
6. [Integración con TalentOS](#integración-con-talentos)
7. [Pruebas](#pruebas)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 ¿Por qué Authentik?

### Comparación con Keycloak

| Característica | Authentik | Keycloak |
|----------------|-----------|----------|
| **Facilidad** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐☆☆ |
| **UI Moderna** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐☆☆ |
| **Recursos** | 512MB RAM | 1-2GB RAM |
| **Configuración** | UI intuitiva | Más complejo |
| **Documentación** | Excelente | Buena pero densa |
| **Comunidad** | Creciendo | Muy grande |
| **Empresarial** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

**Conclusión**: Para tu caso, Authentik es mejor porque es más fácil y tiene todo lo que necesitas.

---

## 📦 Requisitos

### Software
- ✅ Docker (>= 20.10)
- ✅ Docker Compose (>= 2.0)
- ✅ Node.js (>= 18) - ya lo tienes
- ✅ Navegador moderno

### Accesos Externos
- 🔑 Cuenta de Google Cloud Console (para Google OAuth)
- 🔑 Cuenta de Microsoft Azure Portal (para Microsoft OAuth)

### Puertos Necesarios
- `9000` - Authentik Web UI
- `9443` - Authentik HTTPS (opcional)
- `3000` - TalentOS (Next.js)

---

## 🐳 Instalación con Docker

### Paso 1: Crear Directorio para Authentik

```bash
cd ~
mkdir -p authentik-sso
cd authentik-sso
```

### Paso 2: Generar Secretos

```bash
# Generar SECRET_KEY de Django
echo "AUTHENTIK_SECRET_KEY=$(openssl rand -base64 60)" > .env

# Generar PASSWORD de PostgreSQL
echo "PG_PASS=$(openssl rand -base64 36)" >> .env

# Ver los secretos generados
cat .env
```

**Resultado esperado**:
```env
AUTHENTIK_SECRET_KEY=tu-secret-key-generado-aqui
PG_PASS=tu-postgres-password-generado-aqui
```

### Paso 3: Crear `docker-compose.yml`

```bash
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgresql:
    image: postgres:15-alpine
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -d authentik -U authentik"]
      start_period: 20s
      interval: 30s
      retries: 5
      timeout: 5s
    volumes:
      - database:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD: ${PG_PASS}
      POSTGRES_USER: authentik
      POSTGRES_DB: authentik
    networks:
      - authentik

  redis:
    image: redis:alpine
    command: --save 60 1 --loglevel warning
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "redis-cli ping | grep PONG"]
      start_period: 20s
      interval: 30s
      retries: 5
      timeout: 3s
    volumes:
      - redis:/data
    networks:
      - authentik

  server:
    image: ghcr.io/goauthentik/server:2024.2.3
    restart: unless-stopped
    command: server
    environment:
      AUTHENTIK_REDIS__HOST: redis
      AUTHENTIK_POSTGRESQL__HOST: postgresql
      AUTHENTIK_POSTGRESQL__USER: authentik
      AUTHENTIK_POSTGRESQL__NAME: authentik
      AUTHENTIK_POSTGRESQL__PASSWORD: ${PG_PASS}
      AUTHENTIK_SECRET_KEY: ${AUTHENTIK_SECRET_KEY}
      # URLs
      AUTHENTIK_URL: http://localhost:9000
      # Email (opcional, configurar después)
      # AUTHENTIK_EMAIL__HOST: smtp.gmail.com
      # AUTHENTIK_EMAIL__PORT: 587
      # AUTHENTIK_EMAIL__USERNAME: tu-email@gmail.com
      # AUTHENTIK_EMAIL__PASSWORD: tu-app-password
      # AUTHENTIK_EMAIL__USE_TLS: true
      # AUTHENTIK_EMAIL__FROM: authentik@tuempresa.com
    volumes:
      - ./media:/media
      - ./custom-templates:/templates
    ports:
      - "9000:9000"
      - "9443:9443"
    depends_on:
      - postgresql
      - redis
    networks:
      - authentik

  worker:
    image: ghcr.io/goauthentik/server:2024.2.3
    restart: unless-stopped
    command: worker
    environment:
      AUTHENTIK_REDIS__HOST: redis
      AUTHENTIK_POSTGRESQL__HOST: postgresql
      AUTHENTIK_POSTGRESQL__USER: authentik
      AUTHENTIK_POSTGRESQL__NAME: authentik
      AUTHENTIK_POSTGRESQL__PASSWORD: ${PG_PASS}
      AUTHENTIK_SECRET_KEY: ${AUTHENTIK_SECRET_KEY}
    volumes:
      - ./media:/media
      - ./certs:/certs
      - ./custom-templates:/templates
    depends_on:
      - postgresql
      - redis
    networks:
      - authentik

volumes:
  database:
    driver: local
  redis:
    driver: local

networks:
  authentik:
    driver: bridge
EOF
```

### Paso 4: Iniciar Authentik

```bash
# Descargar imágenes e iniciar servicios
docker-compose pull
docker-compose up -d

# Ver logs (útil para diagnosticar problemas)
docker-compose logs -f
```

**Esperar ~30-60 segundos** para que todos los servicios inicien.

### Paso 5: Acceder a Authentik

1. Abrir: **http://localhost:9000**
2. Primera vez: Se mostrará el asistente de configuración inicial
3. Crear usuario administrador:
   - **Email**: `admin@tuempresa.com`
   - **Username**: `akadmin`
   - **Password**: `TuPasswordSeguro123!`

**¡Listo!** Authentik está corriendo.

---

## 🔑 Configurar Google OAuth

### Paso 1: Crear Proyecto en Google Cloud Console

1. Ir a: https://console.cloud.google.com/
2. Crear nuevo proyecto: "TalentOS SSO"
3. Ir a: **APIs & Services** > **Credentials**

### Paso 2: Configurar Pantalla de Consentimiento

1. Click: **OAuth consent screen**
2. Tipo: **Interno** (si tienes Google Workspace) o **Externo**
3. Rellenar:
   ```
   Nombre: TalentOS
   Email de soporte: tu-email@empresa.com
   Logo: (opcional)
   Dominio autorizado: localhost (desarrollo)
   ```
4. **Scopes**: Añadir:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
5. Guardar

### Paso 3: Crear Credenciales OAuth

1. **Credentials** > **Create Credentials** > **OAuth 2.0 Client ID**
2. Tipo: **Web application**
3. Nombre: `TalentOS - Authentik`
4. **Authorized redirect URIs**:
   ```
   http://localhost:9000/source/oauth/callback/google/
   ```
   **⚠️ IMPORTANTE**: Incluir la `/` final
5. Click **Create**
6. **Copiar**:
   - `Client ID`: `123456789-abcdefg.apps.googleusercontent.com`
   - `Client Secret`: `GOCSPX-AbCdEfGhIjKlMnOpQrStUvWx`

### Paso 4: Configurar en Authentik

1. Login en Authentik: http://localhost:9000
2. Ir a: **Admin interface** (arriba derecha)
3. **Directory** > **Federation & Social login**
4. Click: **Create** > **Google**
5. Rellenar:
   ```
   Name: Google
   Slug: google
   Consumer key: [TU_CLIENT_ID_DE_GOOGLE]
   Consumer secret: [TU_CLIENT_SECRET_DE_GOOGLE]
   ```
6. **Scope**: `openid email profile`
7. **Save**

### Paso 5: Verificar Configuración

1. Logout de Authentik
2. En login, ver botón: **Continue with Google**
3. ✅ Si aparece, está configurado correctamente

---

## 🔷 Configurar Microsoft OAuth

### Paso 1: Registro en Azure AD

1. Ir a: https://portal.azure.com/
2. **Azure Active Directory** > **App registrations**
3. Click: **New registration**

### Paso 2: Registrar Aplicación

```
Nombre: TalentOS SSO
Tipos de cuenta soportados: 
  ✅ Cuentas en cualquier directorio organizacional 
     y cuentas personales de Microsoft
Redirect URI:
  Web: http://localhost:9000/source/oauth/callback/microsoft/
```

Click **Register**

### Paso 3: Obtener Credenciales

1. En la página de la app registrada, copiar:
   - **Application (client) ID**: `abc12345-6789-0def-ghij-klmnopqrstuv`
   - **Directory (tenant) ID**: `xyz98765-4321-0abc-defg-hijklmnopqrs`

2. Ir a: **Certificates & secrets**
3. **New client secret**:
   ```
   Description: TalentOS Authentik Secret
   Expires: 24 months (o lo que prefieras)
   ```
4. Click **Add**
5. **Copiar el Value INMEDIATAMENTE** (solo se muestra una vez):
   - `Client Secret`: `AbC~1234567890DEfghIjKLmnOpqRsTuVwXyZ`

### Paso 4: Configurar Permisos API

1. **API permissions** > **Add a permission**
2. **Microsoft Graph** > **Delegated permissions**
3. Añadir:
   - ✅ `User.Read`
   - ✅ `email`
   - ✅ `profile`
   - ✅ `openid`
4. Click: **Grant admin consent for [Tu Empresa]**

### Paso 5: Configurar en Authentik

1. Authentik Admin: **Directory** > **Federation & Social login**
2. Click: **Create** > **Microsoft**
3. Rellenar:
   ```
   Name: Microsoft
   Slug: microsoft
   Consumer key: [APPLICATION_CLIENT_ID]
   Consumer secret: [CLIENT_SECRET_VALUE]
   ```
4. **Additional settings**:
   ```json
   {
     "tenant": "common"
   }
   ```
   - `"common"` = cualquier cuenta Microsoft
   - `"tu-tenant-id"` = solo tu organización
5. **Save**

### Paso 6: Verificar

1. Logout de Authentik
2. Ver botón: **Continue with Microsoft**
3. ✅ Configurado correctamente

---

## 🔗 Integración con TalentOS

### Paso 1: Crear Aplicación en Authentik

1. Authentik Admin: **Applications** > **Applications**
2. Click: **Create**
3. Configurar:
   ```
   Name: TalentOS
   Slug: talentos
   Group: (vacío)
   Policy engine mode: any
   ```
4. **Save**

### Paso 2: Crear Provider (OpenID)

1. Authentik Admin: **Applications** > **Providers**
2. Click: **Create** > **OAuth2/OpenID Provider**
3. Configurar:
   ```
   Name: TalentOS Provider
   Authorization flow: default-provider-authorization-implicit-consent
   
   Client type: Confidential
   Client ID: talentos-client
   Client Secret: [GENERAR NUEVO - copiar este valor]
   
   Redirect URIs:
     http://localhost:3000/api/auth/callback/authentik
   
   Signing Key: authentik Self-signed Certificate
   ```
4. **Save** y **copiar Client Secret**

### Paso 3: Vincular Provider con Aplicación

1. **Applications** > **Applications** > **TalentOS**
2. Edit > **Provider**: Seleccionar `TalentOS Provider`
3. **Save**

### Paso 4: Instalar NextAuth.js en TalentOS

```bash
cd ~/Documentos/00_Organizacion/01_Proyectos/01_Apps/2_Aplicaciones_Gestion/saas_formacion/TalentOs

npm install next-auth @next-auth/prisma-adapter
```

### Paso 5: Configurar Variables de Entorno

Editar `.env.local`:

```bash
cat >> .env.local << 'EOF'

# ===== AUTHENTIK SSO =====
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=genera-un-secret-aqui-con-openssl-rand-base64-32

# Authentik
AUTHENTIK_ID=talentos-client
AUTHENTIK_SECRET=el-client-secret-que-copiaste-en-paso-2
AUTHENTIK_ISSUER=http://localhost:9000/application/o/talentos/
EOF
```

**Generar NEXTAUTH_SECRET**:
```bash
openssl rand -base64 32
```

### Paso 6: Crear API Route para NextAuth

Crear archivo: `src/app/api/auth/[...nextauth]/route.ts`

```typescript
import NextAuth, { NextAuthOptions } from 'next-auth';

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: 'authentik',
      name: 'Authentik',
      type: 'oauth',
      wellKnown: `${process.env.AUTHENTIK_ISSUER}.well-known/openid-configuration`,
      clientId: process.env.AUTHENTIK_ID!,
      clientSecret: process.env.AUTHENTIK_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile',
        },
      },
      idToken: true,
      checks: ['pkce', 'state'],
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name || profile.preferred_username,
          email: profile.email,
          image: profile.picture,
        };
      },
    },
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Aquí puedes sincronizar el usuario con tu DB local (Dexie)
      console.log('User signed in:', user);
      return true;
    },
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
      }
      return token;
    },
    async session({ session, token }) {
      // Añadir tokens a la sesión si los necesitas
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

### Paso 7: Actualizar Tipos de TypeScript

Crear: `src/types/next-auth.d.ts`

```typescript
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    idToken?: string;
  }
}
```

### Paso 8: Crear Página de Login Personalizada

Crear: `src/app/auth/signin/page.tsx`

```typescript
'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            TalentOS
          </CardTitle>
          <CardDescription className="text-center">
            Inicia sesión con tu cuenta empresarial
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* SSO con Authentik (incluye Google y Microsoft) */}
          <Button
            onClick={() => signIn('authentik', { callbackUrl: '/dashboard' })}
            className="w-full"
            size="lg"
            variant="default"
          >
            🔐 Iniciar Sesión Empresarial
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                O continuar con
              </span>
            </div>
          </div>

          {/* Botones directos (opcional) */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => signIn('authentik', { 
                callbackUrl: '/dashboard',
                // Forzar Google (si configuraste múltiples IDPs en Authentik)
              })}
              variant="outline"
              className="w-full"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>

            <Button
              onClick={() => signIn('authentik', { 
                callbackUrl: '/dashboard',
              })}
              variant="outline"
              className="w-full"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4z"
                />
              </svg>
              Microsoft
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-xs text-center text-muted-foreground">
            Al iniciar sesión, aceptas nuestros términos de servicio
            y política de privacidad.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
```

### Paso 9: Crear Página de Error

Crear: `src/app/auth/error/page.tsx`

```typescript
'use client';

import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import Link from 'next/link';

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-red-600">
            Error de Autenticación
          </CardTitle>
          <CardDescription>
            {error === 'Configuration' && 'Hay un problema con la configuración del servidor.'}
            {error === 'AccessDenied' && 'Acceso denegado. No tienes permisos para acceder.'}
            {error === 'Verification' && 'El token de verificación ha expirado o ya fue usado.'}
            {!error && 'Ha ocurrido un error desconocido.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/auth/signin">
              Volver al Inicio de Sesión
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Paso 10: Proteger Rutas con Middleware

Crear: `src/middleware.ts` (en la raíz de `src/`)

```typescript
export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/:path*',
  ],
};
```

---

## 🧪 Pruebas

### Test 1: Login con Google

1. Abrir: http://localhost:3000/auth/signin
2. Click: **Google**
3. Seleccionar cuenta de Google
4. ✅ Redirigido a `/dashboard`

### Test 2: Login con Microsoft

1. Abrir: http://localhost:3000/auth/signin
2. Click: **Microsoft**
3. Login con cuenta Outlook/Microsoft
4. ✅ Redirigido a `/dashboard`

### Test 3: Sesión Persistente

1. Cerrar navegador
2. Abrir de nuevo: http://localhost:3000/dashboard
3. ✅ Sigue logueado (sesión guardada)

### Test 4: Logout

```typescript
// Añadir botón de logout en DashboardHeader
import { signOut } from 'next-auth/react';

<Button onClick={() => signOut({ callbackUrl: '/auth/signin' })}>
  Cerrar Sesión
</Button>
```

---

## 🔧 Troubleshooting

### Problema: "Redirect URI mismatch"

**Solución**:
- Verificar que las URIs en Google/Microsoft/Authentik sean **exactamente iguales**
- Incluir la `/` final en: `http://localhost:9000/source/oauth/callback/google/`

### Problema: "Invalid client secret"

**Solución**:
- Regenerar Client Secret en Authentik
- Actualizar `.env.local` con el nuevo valor
- Reiniciar Next.js: `npm run dev`

### Problema: "CORS error"

**Solución**:
- Authentik debe estar en `http://localhost:9000` (mismo dominio que desarrollo)
- O configurar CORS en Authentik: **System** > **Settings** > **CORS allowed origins**: `http://localhost:3000`

### Problema: "User not found in database"

**Solución**:
- Implementar sincronización automática en callback `signIn`:

```typescript
async signIn({ user, account, profile }) {
  // Conectar a Dexie
  const { createUser } = await import('@/lib/db');
  
  // Verificar si usuario existe
  const existingUser = await db.users.where('email').equals(user.email!).first();
  
  if (!existingUser) {
    // Crear usuario automáticamente
    await createUser({
      name: user.name!,
      email: user.email!,
      role: 'Trabajador', // rol por defecto
      department: 'Sin asignar',
      status: 'pending', // requiere aprobación de admin
    });
  }
  
  return true;
}
```

### Logs Útiles

```bash
# Authentik logs
cd ~/authentik-sso
docker-compose logs -f server

# Next.js logs
# Ya los ves en tu terminal de desarrollo
```

---

## 📚 Recursos Adicionales

- **Authentik Docs**: https://goauthentik.io/docs/
- **NextAuth.js Docs**: https://next-auth.js.org/
- **Google OAuth Setup**: https://console.cloud.google.com/
- **Microsoft Azure Portal**: https://portal.azure.com/

---

## ✅ Checklist Final

- [ ] Authentik instalado y corriendo (http://localhost:9000)
- [ ] Google OAuth configurado en Google Cloud Console
- [ ] Google OAuth configurado en Authentik
- [ ] Microsoft OAuth configurado en Azure Portal
- [ ] Microsoft OAuth configurado en Authentik
- [ ] NextAuth.js instalado en TalentOS
- [ ] Variables de entorno configuradas (`.env.local`)
- [ ] API routes creadas (`[...nextauth]/route.ts`)
- [ ] Página de login personalizada creada
- [ ] Middleware configurado para proteger rutas
- [ ] Pruebas exitosas con Google
- [ ] Pruebas exitosas con Microsoft
- [ ] Sincronización de usuarios funcionando

---

## 🎉 ¡Listo!

Tu TalentOS ahora tiene:
- ✅ SSO empresarial autoalojado (Authentik)
- ✅ Login con Google
- ✅ Login con Microsoft/Outlook
- ✅ Sesiones seguras (NextAuth.js)
- ✅ Rutas protegidas
- ✅ UI moderna de login

**Tiempo total**: ~45 minutos  
**Dificultad**: Media (pero bien documentado)

---

**Última actualización**: 24 de enero de 2026  
**Versiones**: Authentik 2024.2.3, NextAuth.js 4.x, Next.js 15.x
