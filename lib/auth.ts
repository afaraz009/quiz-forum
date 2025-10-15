import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

// Validate required environment variables
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET is required for NextAuth")
}

if (!process.env.NEXTAUTH_URL) {
  throw new Error("NEXTAUTH_URL is required for NextAuth")
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          isAdmin: user.isAdmin,
        }
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user) {
        session.user.id = token.sub!
        
        // Fetch the latest user data to ensure isAdmin is up to date
        try {
          const user = await prisma.user.findUnique({
            where: {
              id: token.sub!
            }
          })
          
          if (user) {
            session.user.isAdmin = user.isAdmin
          } else {
            session.user.isAdmin = token.isAdmin as boolean || false
          }
        } catch (error) {
          console.error("Error fetching user in session callback:", error)
          session.user.isAdmin = token.isAdmin as boolean || false
        }
      }
      return session
    },
    jwt: async ({ user, token }) => {
      if (user) {
        token.sub = user.id
        token.isAdmin = (user as any).isAdmin
        
        // Create default folder for new users
        try {
          const existingDefaultFolder = await prisma.folder.findFirst({
            where: {
              userId: user.id,
              isDefault: true
            }
          })
          
          if (!existingDefaultFolder) {
            await prisma.folder.create({
              data: {
                name: "Uncategorized",
                isDefault: true,
                userId: user.id
              }
            })
          }
        } catch (error) {
          console.error("Error creating default folder for user:", error)
        }
      }
      return token
    },
  },
  session: {
    strategy: "jwt",
  },
}