import {
  IconUser,
  IconUsers,
  IconUserPlus,
  IconUserExclamation,
} from "@tabler/icons-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// 1. Define what data we expect
export interface ClientStats {
  total: number
  active: number
  newThisMonth: number
  expiringSoon: number
}

export function StatCards({ stats }: { stats: ClientStats }) {
  // 2. Use the real data in our array
  const cards = [
    {
      title: "Total Members",
      value: stats.total.toString(),
      icon: IconUsers,
      description: "All registered members",
    },
    {
      title: "Active Members",
      value: stats.active.toString(),
      icon: IconUser,
      description: "Currently allowed entry",
    },
    {
      title: "New This Month",
      value: `+${stats.newThisMonth}`,
      icon: IconUserPlus,
      description: "Joined in the last 30 days",
    },
    {
      title: "Expiring Soon",
      value: stats.expiringSoon.toString(),
      icon: IconUserExclamation,
      description: "Expiring in next 7 days",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 max-w-5xl">
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