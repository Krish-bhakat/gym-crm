"use server"

import { db } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
// 👇 FIX 1: Import MemberStatus along with Gender
import { Gender, MemberStatus } from "@prisma/client" 

export async function getDataStats() {
  const session = await auth();
  if (!session?.user?.gymId) return null;

  const gymId = Number(session.user.gymId);

  // Parallel fetching for speed
  const [memberCount, activeCount, attendanceCount, planCount] = await Promise.all([
    db.member.count({ where: { gymId } }),
    db.member.count({ where: { gymId, status: "ACTIVE" } }),
    db.attendance.count({ where: { member: { gymId } } }), // Assuming relation exists
    db.plan.count({ where: { gymId } }),
  ]);

  return {
    members: memberCount,
    activeMembers: activeCount,
    attendanceRecords: attendanceCount,
    plans: planCount,
    // Estimate storage: crude calculation (approx 2KB per member record + overhead)
    estimatedSize: ((memberCount * 2) + (attendanceCount * 0.5)).toFixed(2) + " KB"
  };
}

export async function deleteInactiveMembers() {
  const session = await auth();
  if (!session?.user?.gymId) return { success: false, error: "Unauthorized" };

  try {
    const result = await db.member.deleteMany({
      where: {
        gymId: Number(session.user.gymId),
        status: "INACTIVE", // Only delete inactive
        // Safety: Only delete if inactive for more than 6 months? 
        // For now, we will just delete all inactive to keep it simple as requested.
      }
    });

    revalidatePath("/dashboard/settings");
    return { success: true, count: result.count };
  } catch (error) {
    return { success: false, error: "Failed to delete records." };
  }
}export async function importMembersWithMap(rawData: any[], map: Record<string, string>) {
    const session = await auth();
    if (!session?.user?.gymId) return { error: "Unauthorized" };
  
    const gymId = Number(session.user.gymId);
  
    try {
      const dataToInsert = rawData.map((row) => {
          
          // Use the MAP to find the data, regardless of what the CSV header is
          const name = row[map.fullName] || "Unknown";
          const rawPhone = row[map.whatsapp];
          const bioId = row[map.biometricId]; 
          const rawGender = row[map.gender];
          const email = map.email ? row[map.email] : null;
  
          // Clean Data
          let genderEnum: Gender = Gender.MALE;
          if (rawGender?.toString().toLowerCase().startsWith("f")) genderEnum = Gender.FEMALE;
          if (rawGender?.toString().toLowerCase().startsWith("o")) genderEnum = Gender.OTHER;
  
          // Clean Phone (remove spaces/dashes)
          const cleanPhone = rawPhone ? String(rawPhone).replace(/[^0-9]/g, "") : "";
  
          return {
              fullName: name,
              whatsapp: cleanPhone,
              biometricId: bioId ? String(bioId) : null,
              gender: genderEnum,
              email: email,
              
              // Defaults
              status: MemberStatus.ACTIVE,
              planName: "Migrated Member",
              gymId: gymId,
              startDate: new Date(),
              endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)), 
          };
      });
  
      // Remove rows that are missing the absolute essentials (Biometric ID)
      const validRows = dataToInsert.filter(r => r.biometricId && r.fullName !== "Unknown");
  
      if (validRows.length === 0) {
          return { success: false, error: "No valid rows found. Did you map the 'Biometric ID' column correctly?" };
      }
  
      await db.member.createMany({
        data: validRows,
        skipDuplicates: true, 
      });
  
      revalidatePath("/dashboard/clients");
      return { success: true, count: validRows.length };
  
    } catch (error) {
      console.error("Import Error:", error);
      return { success: false, error: "Database error during import." };
    }
  }