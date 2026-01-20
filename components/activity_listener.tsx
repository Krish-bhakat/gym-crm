"use client"

import { useEffect } from "react"
import Pusher from "pusher-js"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function RealtimeListener() {
  const router = useRouter()

  useEffect(() => {
    // 1. Connect to Pusher
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    })

    // 2. Subscribe to the channel
    const channel = pusher.subscribe("gym-updates")

    // 3. Bind to the event
    channel.bind("new-attendance", (data: any) => {
      // A. Show a notification (Optional)
      toast.success(data.message)

      // B. Refresh data WITHOUT reloading the page
      router.refresh() 
    })

    // 4. Cleanup on unmount
    return () => {
      pusher.unsubscribe("gym-updates")
    }
  }, [router])

  return null // This component is invisible
}