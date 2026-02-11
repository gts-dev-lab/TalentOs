# Guía de Autenticación con Proveedores Autoalojados - TalentOS

**Fecha**: 24 de enero de 2026  
**Objetivo**: Implementar SSO (Single Sign-On) con proveedores OAuth/OIDC autoalojados

---

## 🎯 Opciones de Proveedores Autoalojados

### 1. **Keycloak** (Recomendado) ⭐

**Características**:
- ✅ Open Source completo
- ✅ Soporte OIDC, SAML, OAuth 2.0
- ✅ Gestión completa de usuarios
- ✅ Multi-tenancy
- ✅ Roles y permisos granulares
- ✅ Federación de identidades
- ✅ 2FA/MFA integrado

**Docker Compose**:
```yaml
version: '3'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: keycloak
      POSTGRES_USER: keycloak
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  keycloak:
    image: quay.io/keycloak/keycloak:23.0
    command: start-dev
    environment:
      KC_HOSTNAME: localhost
      KC_HOSTNAME_PORT: 8080
      KC_HOSTNAME_STRICT_BACKCHANNEL: false
      KC_HTTP_ENABLED: true
      KC_HOSTNAME_STRICT_HTTPS: false
      KC_HEALTH_ENABLED: true
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres/keycloak
      KC_DB_USERNAME: keycloak
      KC_DB_PASSWORD: password
    ports:
      - 8080:8080
    depends_on:
      - postgres

volumes:
  postgres_data:
```

**Configuración en TalentOS**:
```env
# .env.local
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=talentos
KEYCLOAK_CLIENT_ID=talentos-app
KEYCLOAK_CLIENT_SECRET=tu-secret-aqui
```

---

### 2. **Authentik** 

**Características**:
- ✅ Open Source (Python/Django)
- ✅ UI moderna y fácil de usar
- ✅ Soporte OAuth2, OIDC, SAML
- ✅ Políticas flexibles
- ✅ Flujos de autenticación personalizables
- ✅ Branding personalizable

**Docker Compose**:
```yaml
version: '3'

services:
  postgresql:
    image: postgres:15-alpine
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -d $${POSTGRES_DB} -U $${POSTGRES_USER}"]
      start_period: 20s
      interval: 30s
      retries: 5
      timeout: 5s
    volumes:
      - database:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD: authentik
      POSTGRES_USER: authentik
      POSTGRES_DB: authentik

  redis:
    image: redis:alpine
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "redis-cli ping | grep PONG"]
      start_period: 20s
      interval: 30s
      retries: 5
      timeout: 3s

  authentik-server:
    image: ghcr.io/goauthentik/server:latest
    restart: unless-stopped
    command: server
    environment:
      AUTHENTIK_REDIS__HOST: redis
      AUTHENTIK_POSTGRESQL__HOST: postgresql
      AUTHENTIK_POSTGRESQL__USER: authentik
      AUTHENTIK_POSTGRESQL__NAME: authentik
      AUTHENTIK_POSTGRESQL__PASSWORD: authentik
      AUTHENTIK_SECRET_KEY: tu-secret-key-aqui
    ports:
      - 9000:9000
      - 9443:9443
    depends_on:
      - postgresql
      - redis

  authentik-worker:
    image: ghcr.io/goauthentik/server:latest
    restart: unless-stopped
    command: worker
    environment:
      AUTHENTIK_REDIS__HOST: redis
      AUTHENTIK_POSTGRESQL__HOST: postgresql
      AUTHENTIK_POSTGRESQL__USER: authentik
      AUTHENTIK_POSTGRESQL__NAME: authentik
      AUTHENTIK_POSTGRESQL__PASSWORD: authentik
      AUTHENTIK_SECRET_KEY: tu-secret-key-aqui
    depends_on:
      - postgresql
      - redis

volumes:
  database:
```

---

### 3. **Ory Hydra + Ory Kratos**

**Características**:
- ✅ Open Source (Go)
- ✅ Cloud-native
- ✅ Alta performance
- ✅ Certificación OpenID
- ✅ Headless (API-first)

**Docker Compose**:
```yaml
version: '3'

services:
  hydra:
    image: oryd/hydra:latest
    ports:
      - "4444:4444" # Public port
      - "4445:4445" # Admin port
    command: serve all --dev
    environment:
      DSN: postgres://hydra:secret@postgresd:5432/hydra?sslmode=disable
      URLS_SELF_ISSUER: http://localhost:4444/
      URLS_CONSENT: http://localhost:3000/consent
      URLS_LOGIN: http://localhost:3000/login
    depends_on:
      - hydra-migrate

  hydra-migrate:
    image: oryd/hydra:latest
    environment:
      DSN: postgres://hydra:secret@postgresd:5432/hydra?sslmode=disable
    command: migrate sql -e --yes
    depends_on:
      - postgresd

  postgresd:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: hydra
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: hydra
```

---

## 📝 Implementación en TalentOS

### Opción A: NextAuth.js con Proveedores Personalizados

**Ventajas**:
- ✅ Integración nativa con Next.js
- ✅ Soporte para múltiples proveedores
- ✅ Session handling automático
- ✅ Callbacks personalizables

**Instalación**:
```bash
npm install next-auth @auth/core
```

**Configuración**:
```typescript
// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth"
import type { AuthOptions } from "next-auth"
import KeycloakProvider from "next-auth/providers/keycloak"

export const authOptions: AuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER,
    }),
    // Proveedor personalizado
    {
      id: "custom-oidc",
      name: "Mi Sistema SSO",
      type: "oauth",
      wellKnown: `${process.env.OIDC_ISSUER}/.well-known/openid-configuration`,
      authorization: { params: { scope: "openid email profile" } },
      idToken: true,
      checks: ["pkce", "state"],
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        }
      },
    }
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at,
          user,
        }
      }
      return token
    },
    async session({ session, token }) {
      session.user = token.user as any
      session.accessToken = token.accessToken as string
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

---

### Opción B: Implementación Custom con `openid-client`

**Ventajas**:
- ✅ Control total
- ✅ Sin dependencias pesadas
- ✅ Más flexible

**Instalación**:
```bash
npm install openid-client
```

**Implementación**:
```typescript
// src/lib/auth/oidc.ts
import { Issuer, generators } from 'openid-client';

export class OIDCProvider {
  private client: any;
  private issuer: any;

  async initialize() {
    // Descubrir configuración OIDC
    this.issuer = await Issuer.discover(process.env.OIDC_ISSUER!);
    
    this.client = new this.issuer.Client({
      client_id: process.env.OIDC_CLIENT_ID!,
      client_secret: process.env.OIDC_CLIENT_SECRET,
      redirect_uris: [`${process.env.NEXT_PUBLIC_URL}/api/auth/callback`],
      response_types: ['code'],
    });
  }

  generateAuthUrl() {
    const code_verifier = generators.codeVerifier();
    const code_challenge = generators.codeChallenge(code_verifier);
    
    const authUrl = this.client.authorizationUrl({
      scope: 'openid email profile',
      code_challenge,
      code_challenge_method: 'S256',
    });

    return { authUrl, code_verifier };
  }

  async handleCallback(params: any, code_verifier: string) {
    const tokenSet = await this.client.callback(
      `${process.env.NEXT_PUBLIC_URL}/api/auth/callback`,
      params,
      { code_verifier }
    );

    const userinfo = await this.client.userinfo(tokenSet.access_token);
    
    return {
      user: userinfo,
      tokens: tokenSet,
    };
  }

  async refreshToken(refresh_token: string) {
    const tokenSet = await this.client.refresh(refresh_token);
    return tokenSet;
  }

  async revokeToken(token: string) {
    await this.client.revoke(token);
  }
}
```

**API Routes**:
```typescript
// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { OIDCProvider } from '@/lib/auth/oidc';
import { cookies } from 'next/headers';

export async function GET() {
  const provider = new OIDCProvider();
  await provider.initialize();
  
  const { authUrl, code_verifier } = provider.generateAuthUrl();
  
  // Guardar code_verifier en cookie segura
  cookies().set('code_verifier', code_verifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutos
  });
  
  return NextResponse.redirect(authUrl);
}
```

```typescript
// src/app/api/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { OIDCProvider } from '@/lib/auth/oidc';
import { cookies } from 'next/headers';
import { signSessionToken } from '@/lib/auth/jwt';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const code_verifier = cookies().get('code_verifier')?.value;
  
  if (!code || !code_verifier) {
    return NextResponse.redirect(new URL('/auth/error', request.url));
  }
  
  try {
    const provider = new OIDCProvider();
    await provider.initialize();
    
    const { user, tokens } = await provider.handleCallback(
      { code },
      code_verifier
    );
    
    // Crear o actualizar usuario en tu BD
    const dbUser = await createOrUpdateUser({
      id: user.sub,
      email: user.email,
      name: user.name,
      avatar: user.picture,
    });
    
    // Crear sesión JWT
    const sessionToken = await signSessionToken({
      userId: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
    });
    
    // Guardar tokens
    cookies().set('auth-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 días
    });
    
    cookies().set('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 días
    });
    
    // Limpiar code_verifier
    cookies().delete('code_verifier');
    
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(new URL('/auth/error', request.url));
  }
}
```

---

## 🎨 UI de Login con Múltiples Proveedores

```typescript
// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Building2, Key, Mail } from 'lucide-react';

export default function LoginPage() {
  const [loginMethod, setLoginMethod] = useState<'credentials' | 'sso'>('credentials');

  const handleSSOLogin = async (provider: string) => {
    window.location.href = `/api/auth/login/${provider}`;
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Building2 className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">TalentOS</CardTitle>
          <CardDescription>
            Inicia sesión para acceder a la plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Botones SSO */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleSSOLogin('keycloak')}
            >
              <Key className="mr-2 h-4 w-4" />
              Iniciar con SSO Corporativo
            </Button>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleSSOLogin('authentik')}
            >
              <Building2 className="mr-2 h-4 w-4" />
              Iniciar con Authentik
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                O continúa con
              </span>
            </div>
          </div>

          {/* Login tradicional */}
          <form className="space-y-4" onSubmit={(e) => {
            e.preventDefault();
            // Handle login
          }}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="tu@empresa.com"
                type="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              <Mail className="mr-2 h-4 w-4" />
              Iniciar Sesión
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            <a href="/auth/reset-password" className="hover:text-primary underline">
              ¿Olvidaste tu contraseña?
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 🔐 Sincronización de Usuarios

```typescript
// src/lib/auth/user-sync.ts
import * as db from '@/lib/db';
import type { User } from '@/lib/types';

interface OIDCUser {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  preferred_username?: string;
  groups?: string[];
  roles?: string[];
}

export async function createOrUpdateUser(oidcUser: OIDCUser): Promise<User> {
  // Buscar usuario existente por email o ID externo
  let user = await db.getUserByEmail(oidcUser.email);
  
  if (!user) {
    // Crear nuevo usuario
    const newUser: Partial<User> = {
      name: oidcUser.name,
      email: oidcUser.email,
      avatar: oidcUser.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${oidcUser.name}`,
      role: mapRoleFromOIDC(oidcUser.roles || oidcUser.groups || []),
      department: extractDepartment(oidcUser),
      status: 'active',
      externalId: oidcUser.sub,
      authProvider: 'oidc',
      createdAt: new Date().toISOString(),
    };
    
    const userId = await db.createUser(newUser as User);
    user = await db.getUser(userId);
  } else {
    // Actualizar usuario existente
    await db.updateUser(user.id!, {
      name: oidcUser.name,
      avatar: oidcUser.picture || user.avatar,
      externalId: oidcUser.sub,
      authProvider: 'oidc',
      lastLogin: new Date().toISOString(),
    });
    user = await db.getUser(user.id!);
  }
  
  return user!;
}

function mapRoleFromOIDC(groups: string[]): User['role'] {
  // Mapear grupos/roles de OIDC a roles internos
  const roleMap: Record<string, User['role']> = {
    'admin': 'Administrador General',
    'hr-manager': 'Gestor de RRHH',
    'training-manager': 'Jefe de Formación',
    'instructor': 'Formador',
    'external': 'Personal Externo',
    'employee': 'Trabajador',
  };
  
  // Buscar el rol más alto
  for (const [oidcRole, appRole] of Object.entries(roleMap)) {
    if (groups.some(g => g.toLowerCase().includes(oidcRole))) {
      return appRole;
    }
  }
  
  return 'Trabajador'; // Default
}

function extractDepartment(oidcUser: OIDCUser): string | undefined {
  // Extraer departamento de los claims
  return (oidcUser as any).department || 
         (oidcUser as any).ou || 
         (oidcUser as any).organizationalUnit;
}
```

---

## 🔄 Middleware de Autenticación

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken } from '@/lib/auth/jwt';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const { pathname } = request.nextUrl;
  
  // Rutas públicas
  const publicPaths = ['/login', '/auth', '/api/auth', '/certificates/verify'];
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // Verificar token
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  try {
    const session = await verifySessionToken(token);
    
    // Verificar expiración del token OIDC y renovar si es necesario
    const refreshToken = request.cookies.get('refresh_token')?.value;
    if (refreshToken && shouldRefreshToken(session)) {
      // Renovar token en background
      fetch(new URL('/api/auth/refresh', request.url), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
    }
    
    return NextResponse.next();
  } catch (error) {
    // Token inválido, redirigir a login
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

function shouldRefreshToken(session: any): boolean {
  // Renovar si queda menos de 5 minutos
  const expiresIn = session.exp - Math.floor(Date.now() / 1000);
  return expiresIn < 300;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};
```

---

## 📊 Comparativa de Proveedores

| Característica | Keycloak | Authentik | Ory Hydra |
|---------------|----------|-----------|-----------|
| **Facilidad de uso** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Documentación** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Performance** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Comunidad** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Funcionalidades** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **UI Admin** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Recursos** | Alto | Medio | Bajo |

---

## 🚀 Recomendación

Para TalentOS, recomiendo **Keycloak** porque:

1. ✅ **Maduro y estable** - Usado por empresas grandes
2. ✅ **Documentación extensa** - Muchos recursos y ejemplos
3. ✅ **Funcionalidades completas** - Todo lo que necesitas
4. ✅ **Integración fácil con NextAuth.js**
5. ✅ **Soporte empresarial** disponible (Red Hat)

---

## 📝 Próximos Pasos

1. **Decidir proveedor** (Keycloak recomendado)
2. **Levantar contenedores Docker**
3. **Configurar realm y cliente en Keycloak**
4. **Implementar rutas de autenticación en TalentOS**
5. **Probar flujo completo de SSO**
6. **Configurar sincronización de usuarios**
7. **Implementar renovación de tokens**

---

¿Quieres que implemente Keycloak + NextAuth.js en TalentOS ahora? 🚀
