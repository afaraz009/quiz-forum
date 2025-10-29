import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { UserNav } from "@/components/user-nav";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Quiz Forum",
  description: "Interactive quiz application with user authentication",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            <header className="sticky top-0 z-50 glass border-b border-border/50">
              <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                <Link href="/" className="group">
                  <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-200">
                    Quiz Forum
                  </h1>
                </Link>
                <UserNav />
              </div>
            </header>
            <main className="flex-1 animate-fade-in">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
