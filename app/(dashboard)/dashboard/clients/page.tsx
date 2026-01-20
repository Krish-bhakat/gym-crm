import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import ClientsView from "./action" // ✅ Make sure this import is correct
import { ClientUser } from "./action" // Import the type
import { Button } from "@/components/ui/button" // 👈 Import Button
import { UserPlus } from "lucide-react"
import { ExportClientsButton } from "@/components/export-cleints-button";

export default async function ClientsPage() {
  const session = await auth()
  if (!session?.user?.email) redirect("/login")

  const user = await db.user.findUnique({
    where: { email: session.user.email },
  })
  if (!user) redirect("/login")

  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const sevenDaysFromNow = new Date()
  sevenDaysFromNow.setDate(now.getDate() + 7)

  // ✅ ADDED: Fetch Plans here alongside members
  const [members, totalCount, activeCount, newCount, expiringCount, plans] = await Promise.all([
    db.member.findMany({
      where: { gymId: user.gymId },
      orderBy: { createdAt: 'desc' }
    }),
    db.member.count({ where: { gymId: user.gymId } }),
    db.member.count({ where: { gymId: user.gymId, status: "ACTIVE" } }),
    db.member.count({ where: { gymId: user.gymId, createdAt: { gte: firstDayOfMonth } } }),
    db.member.count({
      where: {
        gymId: user.gymId,
        endDate: { gte: now, lte: sevenDaysFromNow }
      }
    }),
    // 👇 Fetching plans here
    db.plan.findMany({
      where: { gymId: user.gymId },
      select: { id: true, name: true, duration: true }
    })
  ])

  const formattedUsers: ClientUser[] = members.map((member) => ({
    id: member.id,
    name: member.fullName, 
    plan: member.planName || "Standard",
    fullName: member.fullName, 
    planName: member.planName || "",
    email: member.email || "",
    whatsapp: member.whatsapp || "", 
    avatar: member.photoUrl || "",
    dob: member.dob ,
    photoUrl: member.photoUrl,
    role: "Member",
    billing: "Paid", 
    biometricId: member.biometricId, 
    planId: member.planId,           
    endDate: member.endDate,
    status: member.status,
    joinedDate: member.startDate.toISOString().split('T')[0],
    lastLogin: member.updatedAt.toISOString().split('T')[0],
  }))

  const stats = {
    total: totalCount,
    active: activeCount,
    newThisMonth: newCount,
    expiringSoon: expiringCount
  }

  // ✅ Pass 'plans' to the component
  return <ClientsView initialUsers={formattedUsers} stats={stats} plans={plans} />
}