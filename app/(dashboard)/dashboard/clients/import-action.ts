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
          // 1. Extract Values using Map
          const name = map.fullName ? row[map.fullName] : "Unknown";
          const rawPhone = map.whatsapp ? row[map.whatsapp] : "";
          const bioId = map.biometricId ? row[map.biometricId] : null;
          const rawGender = map.gender ? row[map.gender] : "";
          const email = map.email ? row[map.email] : null;
          
          // 👇 FIX 1: Parse Joining Date (Handle DD/MM vs MM/DD format issues if needed)
          let joinDate = new Date(); // Default to today
          if (map.joinDate && row[map.joinDate]) {
             const parsed = new Date(row[map.joinDate]);
             if (!isNaN(parsed.getTime())) joinDate = parsed;
          }

          // 2. Clean Data
          let genderEnum: Gender = Gender.MALE; // Default
          if (rawGender?.toString().toLowerCase().startsWith("f")) genderEnum = Gender.FEMALE;
          if (rawGender?.toString().toLowerCase().startsWith("o")) genderEnum = Gender.OTHER;
  
          // Clean Phone (keep only digits)
          const cleanPhone = rawPhone ? String(rawPhone).replace(/[^0-9]/g, "") : "";
  
          return {
              fullName: name,
              whatsapp: cleanPhone,
              // 👇 FIX 2: Ensure empty strings become null for Unique Constraint safety
              biometricId: bioId && bioId.trim() !== "" ? String(bioId) : null, 
              gender: genderEnum,
              email: email,
              status: MemberStatus.ACTIVE,
              planName: "Migrated Member",
              gymId: gymId,
              startDate: joinDate, // Use the real join date
              endDate: new Date(new Date(joinDate).setMonth(joinDate.getMonth() + 1)), 
          };
      });
  
      // 👇 FIX 3: Filter logic relaxed. 
      // Only require Name. Biometric ID is optional.
      const validRows = dataToInsert.filter(r => r.fullName && r.fullName !== "Unknown");
  
      if (validRows.length === 0) {
          return { success: false, error: "No valid rows found. Please ensure 'Full Name' is mapped." };
      }
  
      await db.member.createMany({
        data: validRows,
        skipDuplicates: true, // Skips if Phone Number already exists (assuming Phone is unique)
      });
  
      revalidatePath("/dashboard/clients");
      return { success: true, count: validRows.length };
  
    } catch (error) {
      console.error("Import Error:", error);
      return { success: false, error: "Database error. Check for duplicate phone numbers or invalid data." };
    }
}