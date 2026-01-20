import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AddStaffDialog } from "./add-staff";
import { StaffList } from "@/components/staff-list"; // We create this next
import { Users } from "lucide-react";

export default async function StaffPage() {
  const session = await auth();
  if (!session?.user?.gymId) redirect("/login");

  // Fetch Staff with their attendance stats
  const staff = await db.staff.findMany({
    where: { gymId: Number(session.user.gymId) },
    include: {
      _count: { select: { attendance: true } },
      // Optional: Get the very last check-in time
      attendance: {
        orderBy: { checkIn: 'desc' },
        take: 1
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8 text-blue-600" /> Staff Management
          </h1>
          <p className="text-muted-foreground">
            Manage employees, trainers, and support staff access.
          </p>
        </div>
        <AddStaffDialog />
      </div>

      {/* The List Component */}
      <StaffList staff={staff} />

    </div>
  );
}