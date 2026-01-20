"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// Optional: Zod schema for validation (good practice)
const UpdateMemberSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  whatsapp: z.string().min(10),
  status: z.enum(["ACTIVE", "PENDING", "INACTIVE"]),
  biometricId: z.string().optional(),
})

export async function updateMember(memberId: number, formData: FormData) {
  // 1. Extract and Clean Data
  const rawPlanId = formData.get("planId") as string
  const fullName = formData.get("fullName") as string
  const email = formData.get("email") as string
  const whatsapp = formData.get("whatsapp") as string
  const status = formData.get("status") as "ACTIVE" | "PENDING" | "INACTIVE"
  const biometricId = formData.get("biometricId") as string
  const photoUrl = formData.get("photoUrl") as string
  const dobString = formData.get("dob") as string
  // 2. CRITICAL FIX: Convert planId from String to Int (or null)
  const planId = rawPlanId ? parseInt(rawPlanId) : null

  // 3. (Optional) Fetch Plan Name to keep your string field 'planName' in sync
  let planName = null
  let newEndDate = undefined
  if (planId) {
    const plan = await db.plan.findUnique({ where: { id: planId } })
    const member = await db.member.findUnique({ where: { id: memberId } })

    if(plan && member){
      planName = plan?.name
      const calculatedEndDate = new Date(member.startDate)
      calculatedEndDate.setDate(calculatedEndDate.getDate() + plan.duration)
      
      newEndDate = calculatedEndDate
    }
    
  }

  try {
    // 4. Update Database
    await db.member.update({
      where: { id: memberId },
      data: {
        fullName,
        email: email || null,
        whatsapp,
        status,
        biometricId: biometricId || null,
        photoUrl: photoUrl || null,
        dob: dobString ? new Date(dobString) : null,
        // Update both the Relation ID and the String Name
        planId: planId, 
        planName: planName, // Keeps the legacy string field consistent
        ...(newEndDate && { endDate: newEndDate }),
      },
    })

    // 5. CRITICAL FIX: Force the Dashboard to Refresh
    revalidatePath("/dashboard")
    revalidatePath("/dashboard/clients")
    
    return { success: true }
    
  } catch (error) {
    console.error("Update failed:", error)
    return { success: false, error: "Failed to update member" }
  }
}