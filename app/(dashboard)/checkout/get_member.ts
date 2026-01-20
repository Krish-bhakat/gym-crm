"use server";

// OPTION A: If you are using PRISMA
import { db } from "@/lib/db";

// OPTION B: If you are using DRIZZLE or Raw SQL


export type MemberResult = {
  id: string;
  name: string;
  email: string;
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
          { id: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5, // Limit results for performance
      select: { id: true, name: true, email: true }
    });
    return members;
    
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
}