import type { User } from '@/lib/types';

declare module 'next-auth' {
  interface Session {
    user: User;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    talentosUser?: User;
  }
}
