"use server"

import * as z from "zod"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { Role } from "@prisma/client" // <--- Import the Enum for type safety

const RegisterSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be 6+ characters" }),
  name: z.string().min(1, { message: "Name is required" }),
  gymName: z.string().min(1, { message: "Gym Name is required" }),
})

export async function registerUser(formData: FormData) {
  const validatedFields = RegisterSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
    gymName: formData.get("gymName"),
  })

  if (!validatedFields.success) {
    return { error: "Invalid fields. Please check your inputs." }
  }

  const { email, password, name, gymName } = validatedFields.data

  // 1. Check existing user
  const existingUser = await db.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    return { error: "Email already in use!" }
  }

  // 2. Hash Password
  const hashedPassword = await bcrypt.hash(password, 10)

  // 3. Generate Slug (Safer version removing special chars)
  const slug = gymName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars like !@#
    .replace(/\s+/g, "-")         // Replace spaces with dashes
    + "-" + Math.floor(Math.random() * 1000)

  try {
    // 4. Nested Write: Creates Gym first, then User linked to it
    await db.gym.create({
      data: {
        name: gymName,
        slug: slug,
        users: {
          create: {
            name,
            email,
            password: hashedPassword,
            role: Role.ADMIN, // <--- Using the actual Enum
          },
        },
      },
    })
    return {success: "Account Created Successfully"}
  } catch (err) {
      console.error("Registration Error:", err)
      return { error: "Something went wrong creating the account." }
  }
}