
import { Inter } from 'next/font/google';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/auth';
import { AuthSessionProvider } from '@/components/auth-session-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { PWARegister } from '@/components/pwa-register';
import { ChunkLoadRecovery } from '@/components/chunk-load-recovery';
import './globals.css';
import '../styles/react-big-calendar.css';
import { Metadata } from 'next';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: 'TalentOS',
  description: 'La plataforma de formación impulsada por IA para tu equipo.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
};
 
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
 
  return (
    <html lang="es" suppressHydrationWarning className={inter.className}>
       <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  var key = 'talentos-chunk-reload';
  function isChunkErr(m) { return /ChunkLoadError|Loading chunk \\d+ failed/i.test(String(m || '')); }
  function maybeReload() {
    if (sessionStorage.getItem(key) === '1') return;
    sessionStorage.setItem(key, '1');
    location.reload();
  }
  window.addEventListener('error', function(e) { if (isChunkErr(e.message)) maybeReload(); });
  window.addEventListener('unhandledrejection', function(e) { if (e.reason && isChunkErr(e.reason.message || e.reason)) maybeReload(); });
})();
            `.trim(),
          }}
        />
        <link rel="icon" href="/icon-192x192.png" type="image/png" sizes="192x192" />
        <meta name="theme-color" content="#2E9AFE" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TalentOS" />
      </head>
      <body className="font-body bg-background">
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <AuthSessionProvider>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </AuthSessionProvider>
            <Toaster />
            <PWARegister />
            <ChunkLoadRecovery />
        </ThemeProvider>
      </body>
    </html>
  );
}
