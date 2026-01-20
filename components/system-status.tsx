"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export function SystemStatus() {
  const [status, setStatus] = useState<"loading" | "online" | "offline">("loading")

  useEffect(() => {
    // Check connection immediately on load
    const checkHealth = async () => {
      try {
        const res = await fetch("/api/health")
        if (res.ok) setStatus("online")
        else setStatus("offline")
      } catch (e) {
        setStatus("offline")
      }
    }
    
    checkHealth()
    // Optional: Re-check every 30 seconds
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  const isOnline = status === "online"
  const isOffline = status === "offline"

  return (
    <Card className={`md:col-span-1 transition-colors ${
        isOnline ? "border-green-200 bg-green-50/50 dark:bg-green-900/10" : 
        isOffline ? "border-red-200 bg-red-50/50 dark:bg-red-900/10" : "border-gray-200"
    }`}>
        <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${
                isOnline ? "text-green-800 dark:text-green-400" : 
                isOffline ? "text-red-800 dark:text-red-400" : "text-muted-foreground"
            }`}>
                System Status
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="flex items-center gap-2">
                {/* STATUS LIGHT LOGIC */}
                <span className="relative flex h-3 w-3">
                  {status === "loading" && <span className="h-3 w-3 rounded-full bg-gray-400"></span>}
                  
                  {isOnline && (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </>
                  )}

                  {isOffline && <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>}
                </span>

                {/* TEXT LOGIC */}
                <p className={`text-sm font-medium ${
                    isOnline ? "text-green-900 dark:text-green-100" : 
                    isOffline ? "text-red-900 dark:text-red-100" : "text-muted-foreground"
                }`}>
                    {status === "loading" && "Checking..."}
                    {isOnline && "Online & Ready"}
                    {isOffline && "API Unreachable"}
                </p>
            </div>
        </CardContent>
    </Card>
  )
}