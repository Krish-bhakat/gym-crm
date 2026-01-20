"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function addStaff(formData: FormData) {
  const session = await auth();
  if (!session?.user?.gymId) return { error: "Unauthorized" };

  const name = formData.get("name") as string;
  const role = formData.get("role") as string;
  const rawBioId = formData.get("bioId") as string;
  const phone = formData.get("phone") as string;

  if (!name || !rawBioId) return { error: "Name and Biometric ID are required" };

  // 1. CLEAN THE ID (Remove spaces)
  const bioId = rawBioId.trim();

  try {
    const gymId = Number(session.user.gymId);

    // 2. CHECK MEMBERS (The likely culprit)
    const existingMember = await db.member.findFirst({
        where: { gymId, biometricId: bioId },
        select: { fullName: true } // Fetch name to show in error
    });

    if (existingMember) {
        return { error: `ID ${bioId} is already used by member: ${existingMember.fullName}` };
    }

    // 3. CHECK EXISTING STAFF
    const existingStaff = await db.staff.findFirst({
        where: { gymId, biometricId: bioId },
        select: { fullName: true }
    });

    if (existingStaff) {
        return { error: `ID ${bioId} is already used by staff: ${existingStaff.fullName}` };
    }

    // 4. CREATE STAFF
    await db.staff.create({
      data: {
        gymId,
        fullName: name,
        role: role,
        biometricId: bioId,
        phoneNumber: phone
      }
    });

    revalidatePath("/dashboard/staff");
    return { success: true };

  } catch (error) {
    console.error(error);
    return { error: "Database Error: Could not save staff member." };
  }
}
export async function deleteStaff(staffId: number) {
    const session = await auth();
  
    // 1. Check if user is logged in and has a gym
    if (!session?.user?.gymId) {
      return { error: "Unauthorized" };
    }
  
    try {
      // 2. Delete the staff member
      // SECURITY: We include 'gymId' in the where clause to ensure 
      // a user cannot delete staff from a different gym by guessing the ID.
      await db.staff.delete({
        where: {
          id: staffId,
          gymId: Number(session.user.gymId) 
        }
      });
  
      // 3. Refresh the page data
      revalidatePath("/dashboard/staff");
      return { success: true };
  
    } catch (error) {
      console.error("Delete Error:", error);
      return { error: "Failed to delete staff member." };
    }
  }