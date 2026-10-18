import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "RateUPV — Know your campus", template: "%s | RateUPV" },
  description:
    "Find UP Visayas campus places and services, prepare for your visit, and learn from firsthand student experiences.",
  icons: { icon: "/rate-upv-logo.svg" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-background focus:p-3"
            >
              Skip to content
            </a>
            <SiteHeader />
            {children}
            <SiteFooter />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
