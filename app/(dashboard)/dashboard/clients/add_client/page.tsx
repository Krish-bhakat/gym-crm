import { db } from "@/lib/db"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { AddMemberForm } from "./add-member-form"

export default async function AddClientPage() {
  const session = await auth()
  
  // 1. Check Auth
  if (!session?.user?.email) return redirect("/login")

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { gymId: true }
  })

  // 2. Security Check
  if (!user?.gymId) return redirect("/dashboard")

  // 3. Fetch Plans
  const plans = await db.plan.findMany({
    where: { gymId: user.gymId },
    orderBy: { price: 'asc' }, // Nice to sort by price
    select: {
      id: true,
      name: true,
      duration: true
    }
  });

  return (
    <div className="flex-1 p-4 md:p-8 pt-6">
      {/* 4. Render the form with data */}
      <AddMemberForm plans={plans} />
    </div>
  )
}