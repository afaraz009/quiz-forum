import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/providers'
import { UserNav } from '@/components/user-nav'

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
            <header className="border-b">
              <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold">Quiz Forum</h1>
                <UserNav />
              </div>
            </header>
            <main>{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
