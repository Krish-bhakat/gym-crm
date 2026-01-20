// next-auth.d.ts
import NextAuth, { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  // 1. Extend the Session type (Used in your Dashboard)
  interface Session {
    user: {
      id: string
      gymId: string
      role: string
    } & DefaultSession["user"]
  }

  // 2. Extend the User type (Used during Login)
  interface User {
    gymId: string
    role: string
  }
}

declare module "next-auth/jwt" {
  // 3. Extend the JWT type (Used to pass data from Login to Session)
  interface JWT {
    gymId: string
    role: string
  }
}