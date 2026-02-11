import type { NextAuthOptions } from 'next-auth';
import { users } from '@/lib/data';
import type { User } from '@/lib/types';

const AUTHENTIK_ISSUER = process.env.AUTHENTIK_ISSUER;
const AUTHENTIK_ID = process.env.AUTHENTIK_ID;
const AUTHENTIK_SECRET = process.env.AUTHENTIK_SECRET;

export function isAuthentikConfigured(): boolean {
  return Boolean(AUTHENTIK_ISSUER && AUTHENTIK_ID && AUTHENTIK_SECRET);
}

/**
 * Mapea usuario de NextAuth (SSO) a User de TalentOS.
 * Si existe en users por email, usa sus datos; si no, defaults.
 */
export function mapSessionToUser(profile: {
  sub?: string;
  email?: string | null;
  name?: string | null;
  picture?: string | null;
}): User {
  const email = profile.email ?? '';
  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return {
      id: existing.id,
      name: existing.name,
      email: existing.email,
      avatar: existing.avatar,
      role: existing.role,
      department: existing.department,
      points: existing.points,
      status: existing.status,
      notificationSettings: existing.notificationSettings,
    };
  }
  return {
    id: `sso_${profile.sub ?? 'unknown'}`,
    name: profile.name ?? email.split('@')[0],
    email,
    avatar: profile.picture ?? '',
    role: 'Trabajador',
    department: 'Administración',
    points: 0,
    status: 'approved',
    notificationSettings: { consent: true, channels: ['email', 'app'] },
  };
}

const issuer = AUTHENTIK_ISSUER?.replace(/\/$/, '') ?? '';

export const nextAuthOptions: NextAuthOptions = {
  basePath: '/api/nextauth',
  providers: [
    ...(isAuthentikConfigured()
      ? [
          {
            id: 'authentik',
            name: 'Authentik',
            type: 'oauth' as const,
            wellKnown: `${issuer}/.well-known/openid-configuration`,
            authorization: { params: { scope: 'openid email profile' } },
            clientId: AUTHENTIK_ID!,
            clientSecret: AUTHENTIK_SECRET!,
            idToken: true,
            profile(profile: { sub?: string; email?: string | null; name?: string | null; picture?: string | null }) {
              const u = mapSessionToUser(profile);
              return { ...u, image: u.avatar };
            },
          },
        ]
      : []),
  ],
  callbacks: {
    async signIn() {
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.talentosUser = user as unknown as User;
      }
      return token;
    },
    async session({ session, token }) {
      const u = token.talentosUser as User | undefined;
      if (u) {
        session.user = u as unknown as typeof session.user;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },
  debug: process.env.NODE_ENV === 'development',
};
