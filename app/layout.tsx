import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Analytics } from '@vercel/analytics/react';

export const metadata: Metadata = {
  title: "PostReady - Your Personal Social Media Manager",
  description: "Get personalized content ideas, captions, tags, and posting times based on your business and location.",
  icons: {
    icon: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('theme');
                  if (savedTheme) {
                    document.documentElement.setAttribute('data-theme', savedTheme);
                  } else {
                    const hour = new Date().getHours();
                    const isNightTime = hour < 6 || hour >= 18;
                    const theme = isNightTime ? 'dark' : 'light';
                    document.documentElement.setAttribute('data-theme', theme);
                  }
                } catch (e) {
                  // Fallback to light mode if error
                  document.documentElement.setAttribute('data-theme', 'light');
                }
              })();
            `,
          }}
        />
        {/* Eruda - Mobile Console for debugging on mobile devices */}
        <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Auto-initialize Eruda on mobile devices or when URL has ?eruda=true
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                const forceEruda = window.location.search.includes('eruda=true');
                
                if (isMobile || forceEruda) {
                  eruda.init();
                  console.log('📱 Eruda mobile console initialized! Tap the icon in bottom-right to open.');
                  
                  // Add a welcome message
                  console.log('%c🔍 MOBILE DEBUG MODE ACTIVE', 'color: #00f2ea; font-size: 16px; font-weight: bold;');
                  console.log('Watch for auth-related logs to debug the sign-out issue');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}

