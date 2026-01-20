"use client" // <--- This marks it as a Client Component

import dynamic from "next/dynamic"

// Move the dynamic import here
const ChartAreaInteractive = dynamic(
  () => import("@/components/chart-area-interactive").then((mod) => mod.ChartAreaInteractive),
  { 
    ssr: false, // Now this is allowed because we are in a "use client" file
    loading: () => <div className="h-[300px] w-full bg-muted/20 animate-pulse rounded-xl" />
  }
)

export function DashboardChartWrapper() {
  return <ChartAreaInteractive />
}