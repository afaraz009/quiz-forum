import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/providers'
import { UserNav } from '@/components/user-nav'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Quiz Forum',
  description: 'Interactive quiz application with user authentication',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
              <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                <Link href="/">
                  <h1 className="text-xl font-semibold tracking-tight">Quiz Forum</h1>
                </Link>
                <UserNav />
              </div>
            </header>
            <main className="flex-1">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
