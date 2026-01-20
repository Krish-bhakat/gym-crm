// src/auth.ts
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs" 
import { db } from "@/lib/db"
import { z } from "zod" 

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize (credentials: any) {
        const validatedFields = LoginSchema.safeParse(credentials)

        if (!validatedFields.success) return null

        const { email, password } = validatedFields.data

        // 1. Fetch user (Optional: verify gym connection exists)
        const user = await db.user.findUnique({
          where: { email },
        })

        if (!user || !user.password) return null

        // 2. Check password
        const passwordsMatch = await bcrypt.compare(
          password, 
          user.password
        )

        if (!passwordsMatch) return null

        // 3. CRITICAL: Return the fields needed for Multi-tenancy
        // If you don't return gymId here, it won't be available in the JWT
        return { 
          id: String(user.id), 
          email: user.email,
          gymId: String(user.gymId), // Restored
          role: user.role    // Restored
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id 
        token.gymId = user.gymId // Restored
        token.role = user.role   // Restored
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
        session.user.gymId = token.gymId as string // Pass to Client
        session.user.role = token.role as string   // Pass to Client
      }
      return session
    },
  },
})