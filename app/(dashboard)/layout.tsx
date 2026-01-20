// app/(dashboard)/layout.tsx

import { RealtimeListener } from "@/components/activity_listener"
import React from "react"

export default function DashboardLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <section className="w-full h-full">
      <RealtimeListener/>
      {children}
    </section>
  )
}