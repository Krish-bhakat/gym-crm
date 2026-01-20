"use server"

import { db } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function deleteMemberAction(memberId: number) {
  const session = await auth()
  
  if (!session?.user?.email) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { gymId: true }
    })

    if (!user?.gymId) {
      return { success: false, error: "Gym not found" }
    }

    // Security: Only delete if the member belongs to the user's gym
    const deleted = await db.member.deleteMany({
      where: {
        id: memberId,
        gymId: user.gymId
      }
    })

    if (deleted.count === 0) {
      return { success: false, error: "Member not found or unauthorized" }
    }

    revalidatePath("/dashboard/clients")
    return { success: true }

  } catch (error) {
    console.error("Delete error:", error)
    return { success: false, error: "Failed to delete member" }
  }
}