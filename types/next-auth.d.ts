import NextAuth from "next-auth"

declare module "next-auth" {
  interface User {
    isAdmin?: boolean
  }

  interface Session {
    user: {
      id: string
      email?: string | null
      name?: string | null
      username?: string | null
      isAdmin?: boolean
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    isAdmin?: boolean
  }
}