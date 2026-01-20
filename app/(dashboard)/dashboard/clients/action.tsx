"use client"

import { deleteMemberAction } from "./delete-action"
import { toast } from "sonner"
import { useState, useTransition } from "react"
import { StatCards, ClientStats } from "@/components/stat-cards"
import { DataTable } from "@/components/data-table2"
import { useRouter } from "next/navigation"
import { EditMemberSheet } from "@/components/edit_member"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"
import Link from "next/link" // ✅ FIX 1: Correct Import
import { ExportClientsButton } from "@/components/export-cleints-button" // ✅ FIX 2: Added Import

export interface ClientUser {
  id: number
  fullName: string 
  email: string | null
  whatsapp: string
  photoUrl: string | null 
  dob: Date | null        
  biometricId: string | null 
  planId: number | null   
  planName: string | null
  status: string
  joinedDate: string 
  endDate: Date 
}

interface Plan {
  id: number;
  name: string;
  duration: number;
}

interface ClientsViewProps {
  initialUsers: ClientUser[]
  stats: ClientStats
  plans: Plan[]
}

export default function ClientsView({ initialUsers, stats, plans }: ClientsViewProps) {
  const [editingUser, setEditingUser] = useState<ClientUser | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleDeleteUser = (id: number) => {
    const confirmed = window.confirm("Are you sure you want to delete this member?")
    if (!confirmed) return

    startTransition(async () => {
      const result = await deleteMemberAction(id)
      if (result.success) {
        toast.success("Member deleted")
      } else {
        toast.error(result.error || "Failed to delete")
      }
    })
  } 

  return (
    <div className="flex flex-col gap-8">
      {/* 1. Stats Section */}
      <div className="@container/main px-4 py-4 lg:px-6 max-w-5xl mr-auto w-full">
        <StatCards stats={stats} />
      </div>
      
      {/* Edit Modal (Hidden by default) */}
      <EditMemberSheet 
        member={editingUser} 
        plans={plans}
        open={!!editingUser} 
        onOpenChange={(open) => !open && setEditingUser(null)} 
      />

      {/* 2. Main Content Area */}
      <div className="@container/main px-4 lg:px-6">

        {/* Header Row: Title on Left, Buttons on Right */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">All Members</h2>
          
          <div className="flex gap-4">
            {/* CSV Export Button */}
            <ExportClientsButton />
            
            {/* Add Member Button */}
            <Link href="/dashboard/clients/add_client">
              <Button className="my-0.75">
                <UserPlus className="mr-2 h-4 w-4" /> Add Member
              </Button>
            </Link>
          </div>
        </div>

        {/* Data Table */}
        <DataTable 
          users={initialUsers} 
          onDeleteUser={handleDeleteUser}
          onEditUser={setEditingUser} 
          onAddUser={() => router.push("/dashboard/clients/add_client")} 
        />
      </div>
    </div>
  )
}