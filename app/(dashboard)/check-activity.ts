"use server"

import { db } from "@/lib/db"
import { auth } from "@/auth"
import { Member } from "@prisma/client";


export async function checkLatestActivity(lastCheckTime: number) {
  const session = await auth()
  if (!session?.user?.gymId) return []

  const dateToCheck = new Date(lastCheckTime)

  // Find members created or updated AFTER the last check
  const recentMembers = await db.member.findMany({
    where: {
      gymId: Number(session.user.gymId),
      updatedAt: {
        gt: dateToCheck // "gt" means Greater Than
      }
    },
    select: {
      id: true,
      fullName: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: {
      updatedAt: 'desc'
    },
    take: 5 
  })

  // We map the data to simple objects to send back to client
  return recentMembers.map(m => ({
    name: m.fullName,
    type: m.createdAt.getTime() === m.updatedAt.getTime() ? 'NEW_MEMBER' : 'ENTRY',
    time: m.updatedAt.getTime()
  }))
}