"use server";

// OPTION A: If you are using PRISMA
import { db } from "@/lib/db";

// OPTION B: If you are using DRIZZLE or Raw SQL


export type MemberResult = {
  biometricId: string | null ;
  fullName: string;
  email: string | null;
};

export async function searchMembers(query: string): Promise<MemberResult[]> {
  // 1. If query is empty, return nothing or a default list
  if (!query || query.length < 2) return [];

  try {
    // --- EXAMPLE IMPLEMENTATION (Uncomment yours) ---

    // 🟢 PRISMA Example:
    
    const members = await db.member.findMany({
      where: {
        OR: [
          { fullName: { contains: query, mode: 'insensitive' } },
          { biometricId: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5, // Limit results for performance
      select: { biometricId: true, fullName: true, email: true }
    });
    return members;
    
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
}