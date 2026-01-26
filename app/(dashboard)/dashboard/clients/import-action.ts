"use server"

import { db } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { Gender, MemberStatus } from "@prisma/client"

export async function importMembersWithMap(rawData: any[], map: Record<string, string>) {
    const session = await auth();
    if (!session?.user?.gymId) return { error: "Unauthorized" };
  
    const gymId = Number(session.user.gymId);
  
    try {
      const dataToInsert = rawData.map((row) => {
          // 1. Extract Basic Values
          const name = map.fullName ? row[map.fullName] : "Unknown";
          const rawPhone = map.whatsapp ? row[map.whatsapp] : "";
          const bioId = map.biometricId ? row[map.biometricId] : null;
          const rawGender = map.gender ? row[map.gender] : "";
          const email = map.email ? row[map.email] : null;
          const plan = map.planName ? row[map.planName] : "Standard Plan"; // Default plan

          // 2. Parse Dates (Join Date & DOB)
          let joinDate = new Date();
          if (map.joinDate && row[map.joinDate]) {
             const parsed = new Date(row[map.joinDate]);
             if (!isNaN(parsed.getTime())) joinDate = parsed;
          }

          let birthDate = null;
          if (map.dob && row[map.dob]) {
             const parsed = new Date(row[map.dob]);
             if (!isNaN(parsed.getTime())) birthDate = parsed;
          }

          // 3. Clean Enums & Strings
          let genderEnum: Gender = Gender.MALE;
          if (rawGender?.toString().toLowerCase().startsWith("f")) genderEnum = Gender.FEMALE;
          if (rawGender?.toString().toLowerCase().startsWith("o")) genderEnum = Gender.OTHER;
  
          const cleanPhone = rawPhone ? String(rawPhone).replace(/[^0-9]/g, "") : "";
  
          // 4. Return DB Object
          return {
              fullName: name,
              whatsapp: cleanPhone,
              biometricId: bioId && bioId.trim() !== "" ? String(bioId) : null,
              gender: genderEnum,
              email: email,
              planName: plan, // New Field
              dob: birthDate, // New Field
              
              status: MemberStatus.ACTIVE,
              gymId: gymId,
              startDate: joinDate,
              endDate: new Date(new Date(joinDate).setMonth(joinDate.getMonth() + 1)), 
          };
      });
  
      const validRows = dataToInsert.filter(r => r.fullName && r.fullName !== "Unknown");
  
      if (validRows.length === 0) return { success: false, error: "No valid rows found." };
  
      await db.member.createMany({
        data: validRows,
        skipDuplicates: true,
      });
  
      revalidatePath("/dashboard/clients");
      return { success: true, count: validRows.length };
  
    } catch (error) {
      console.error("Import Error:", error);
      return { success: false, error: "Database error. Check for duplicate phone numbers." };
    }
}

// Stats Getter
export async function getDataStats() {
  const session = await auth();
  if (!session?.user?.gymId) return null;

  const gymId = Number(session.user.gymId);

  const [memberCount, activeCount, attendanceCount] = await Promise.all([
    db.member.count({ where: { gymId } }),
    db.member.count({ where: { gymId, status: "ACTIVE" } }),
    db.attendance.count({ where: { member: { gymId } } }),
  ]);

  return {
    members: memberCount,
    activeMembers: activeCount,
    attendanceRecords: attendanceCount,
    estimatedSize: ((memberCount * 2) + (attendanceCount * 0.5)).toFixed(2) + " KB"
  };
}

// Bulk Delete Action
export async function deleteInactiveMembers() {
  const session = await auth();
  if (!session?.user?.gymId) return { success: false, error: "Unauthorized" };

  try {
    const result = await db.member.deleteMany({
      where: {
        gymId: Number(session.user.gymId),
        status: "INACTIVE",
      }
    });

    revalidatePath("/dashboard/settings");
    return { success: true, count: result.count };
  } catch (error) {
    return { success: false, error: "Failed to delete records." };
  }
}