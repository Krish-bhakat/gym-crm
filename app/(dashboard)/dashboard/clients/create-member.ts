"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function createMember(formData: FormData) {
  const session = await auth();
  
  // 1. Basic Auth Check
  if (!session?.user?.email) return { error: "Unauthorized" };

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { gymId: true }
  });

  if (!user?.gymId) return { error: "No Gym Found" };

  // 2. Extract Data from Form
  const rawPlanId = formData.get("planId") as string;
  const fullName = formData.get("fullName") as string;
  const whatsapp = formData.get("whatsapp") as string;
  const email = formData.get("email") as string;
  const gender = formData.get("gender") as "MALE" | "FEMALE" | "OTHER";
  const dobString = formData.get("dob") as string;
  const photoUrl = formData.get("photoUrl") as string; // 👈 Capture Photo URL

  // 3. Find and Validate Plan
  const planId = parseInt(rawPlanId);
  const selectedPlan = await db.plan.findFirst({
    where: { 
      id: planId,
      gymId: user.gymId // 🔒 Security: User can only select their own plans
    }
  });

  if (!selectedPlan) {
    return { error: "Plan not found" }; 
  }

  // 4. Calculate Dates
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + selectedPlan.duration);

  // Handle DOB safely
  const dob = dobString ? new Date(dobString) : null;

  try {
    await db.member.create({
      data: {
        gymId: user.gymId,
        fullName,
        whatsapp,
        email: email || null,
        photoUrl: photoUrl || null, // ✅ Save Photo
        gender: gender,             // ✅ Save Gender
        dob: dob,                   // ✅ Save Date of Birth
        
        // Plan Details
        planName: selectedPlan.name,
        planId: selectedPlan.id,    // ✅ Save Relation ID (Critical for Dashboard)
        
        status: "ACTIVE",
        startDate: startDate,
        endDate: endDate,
      },
    });

    // 5. Cleanup
    revalidatePath("/dashboard/clients");
    revalidatePath("/dashboard");
    
  } catch (error) {
    console.error("Create failed:", error);
    return { error: "Failed to create member" };
  }

  // 6. Redirect on success (Must be outside try/catch)
  redirect("/dashboard/clients");
}