'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This is a client-side component that immediately redirects to the main dashboard page.
export default function DashboardRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/dashboard');
  }, [router]);

  return null;
}
