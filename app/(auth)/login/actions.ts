"use server"

import { signIn } from "@/auth" // This imports from your auth.ts config
import { AuthError } from "next-auth"

export async function login(formData: FormData) {
  const email = formData.get("email")
  const password = formData.get("password")

  try {
    // This triggers the "authorize" function in your auth.ts
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard", // Where to go after success
    })
  } catch (error) {
    if (error instanceof AuthError) {
      switch ((error as any).type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password!" }
        case "CallbackRouteError":
            return { error: "Login failed. Please verify your account." }
        default:
          return { error: "Something went wrong!" }
      }
    }
    throw error // Re-throw so Next.js can handle redirects
  }
}