import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // Check if user is trying to access admin routes
    if (req.nextUrl.pathname.startsWith("/admin")) {
      // Check if user is admin
      if (!req.nextauth.token?.isAdmin) {
        // Redirect non-admin users to dashboard
        return NextResponse.redirect(new URL("/dashboard", req.url))
      }
    }
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to admin routes only for admin users
        if (req.nextUrl.pathname.startsWith("/admin")) {
          return token?.isAdmin === true
        }
        // For all other protected routes, just check if user is authenticated
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/quiz/:path*"
  ]
}