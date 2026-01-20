"use server"

import { z } from "zod"
import { db } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { sendSms } from "@/lib/sms" // ✅ Make sure this import is here

const AddMemberSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  whatsapp: z.string().min(10, "Valid phone number required"),
  email: z.string().email().optional().or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  planId: z.coerce.number().min(1, "Plan selection is required"),
  dob: z.coerce.date().optional(),
  photoUrl: z.string().optional().or(z.literal("")), 
})

export async function addMember(formData: FormData) {
  const session = await auth()

  if (!session?.user?.id || !session.user.gymId) {
    return { error: "Unauthorized" }
  }

  // 1. Parse Data
  const rawData = {
    fullName: formData.get("fullName"),
    whatsapp: formData.get("whatsapp"),
    email: formData.get("email"),
    gender: formData.get("gender"),
    planId: formData.get("planId"),
    dob: formData.get("dob"),
    photoUrl: formData.get("photoUrl"), 
  }

  const validatedFields = AddMemberSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return { error: "Invalid fields" }
  }

  const data = validatedFields.data
  const gymId = Number(session.user.gymId) // Clean ID
  
  // 2. Find the Plan
  const selectedPlan = await db.plan.findFirst({
    where: { 
      id: data.planId,
      gymId: gymId
    }
  });

  if (!selectedPlan) {
    return { error: "Invalid Plan" };
  }

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + selectedPlan.duration);

  try {
    // 3. Create Member in DB
    const newMember = await db.member.create({
      data: {
        fullName: data.fullName,
        photoUrl: data.photoUrl || null, 
        whatsapp: data.whatsapp,
        email: data.email || null,
        gender: data.gender as any, // Cast if enum mismatch
        planName: selectedPlan.name,
        planId: selectedPlan.id, 
        startDate: startDate,
        endDate: endDate, 
        status: "ACTIVE",
        gymId: gymId,
        // ❌ REMOVED: gymName: session.user.gymName (This column doesn't exist!)
        dob: data.dob || null,
      },
      // ✅ ADDED: Include the Gym details so we can use the name for SMS
      include: {
        gym: true
      }
    })

    // 4. TRIGGER SMS AUTOMATION
    const settings = await db.twilioSettings.findUnique({ 
        where: { gymId: gymId } 
    });

    if (settings?.enableWelcome && settings?.accountSid && newMember.whatsapp) {
      
      // ✅ Now this works because we added 'include: { gym: true }' above
      const gymName = newMember.gym.name; 
      
      const messageBody = settings.welcomeTemplate
        .replace("{gym_name}", gymName)
        .replace("{member_name}", newMember.fullName);

      await sendSms(gymId, newMember.whatsapp, messageBody);
    }

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/clients")

  } catch (error) {
    console.error(error)
    return { error: "Failed to create member" }
  }

  redirect("/dashboard/clients")
}