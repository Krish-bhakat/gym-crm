"use client"

import { useTransition } from "react"
import { updateGymProfile } from "./actions" // Ensure this points to your actions file
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"

interface GymProfileFormProps {
  defaultValues: {
    name: string
    phoneNumber: string
    address: string
  }
}

export function GymProfileForm({ defaultValues }: GymProfileFormProps) {
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await updateGymProfile(formData)
      if (result.success) {
        toast.success(result.success)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label>Gym Name</Label>
        <Input name="gymName" defaultValue={defaultValues.name} placeholder="e.g. Iron Fitness" />
      </div>
      <div className="grid gap-2">
        <Label>Support Phone (WhatsApp)</Label>
        <Input name="phoneNumber" defaultValue={defaultValues.phoneNumber} placeholder="+91..." />
      </div>
      <div className="grid gap-2">
        <Label>Address</Label>
        <Input name="address" defaultValue={defaultValues.address} placeholder="123 Main St" />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Save Changes
      </Button>
    </form>
  )
}