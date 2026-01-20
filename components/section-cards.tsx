"use client"

import {
  IconUser,
  IconUsers,
  IconUserPlus,
  IconActivity,
} from "@tabler/icons-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// 1. Define the interface for the data
export interface DashboardStats {
  totalMembers: number
  activeMembers: number
  newThisMonth: number
  attendanceToday: number // Placeholder for now, or real if you have it
}

export function SectionCards({ stats }: { stats: DashboardStats }) {
  // 2. Use the props
  const cards = [
    {
      title: "Total Members",
      value: stats.totalMembers.toString(),
      icon: IconUsers,
      description: "All registered members",
    },
    {
      title: "Active Now",
      value: stats.activeMembers.toString(),
      icon: IconUser,
      description: "Members with active access",
    },
    {
      title: "New This Month",
      value: `+${stats.newThisMonth}`,
      icon: IconUserPlus,
      description: "Joined in the last 30 days",
    },
    {
      title: "Check-ins Today",
      value: stats.attendanceToday.toString(),
      icon: IconActivity,
      description: "Members visited today",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 ">
      {cards.map((card) => (
        <Card key={card.title} className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}