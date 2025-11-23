import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Analytics } from '@vercel/analytics/react';
import { PostHogProvider } from "@/contexts/PostHogProvider";

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
                    // Default to dark mode for first-time visitors
                    document.documentElement.setAttribute('data-theme', 'dark');
                  }
                } catch (e) {
                  // Fallback to dark mode if error
                  document.documentElement.setAttribute('data-theme', 'dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <PostHogProvider>
          <ThemeProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ThemeProvider>
        </PostHogProvider>
        <Analytics />
      </body>
    </html>
  );
}

