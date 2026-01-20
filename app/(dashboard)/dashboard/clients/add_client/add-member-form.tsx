"use client"

import { useState, useTransition } from "react"
import { addMember } from "./action" 
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, UserPlus, ChevronDownIcon, X } from "lucide-react" // Added 'X'

// 👇 1. Import the UploadButton helper you created
import { UploadButton } from "@/lib/uploadthing"

interface AddMemberFormProps {
  plans: {
    id: number;
    name: string;
    duration: number;
  }[];
}

export function AddMemberForm({ plans }: AddMemberFormProps) {
  const [error, setError] = useState<string>("")
  const [isPending, startTransition] = useTransition()
  const [dob, setDob] = useState<Date>()
  
  // State for the uploaded image URL
  const [photoUrl, setPhotoUrl] = useState("")
  
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    const formData = new FormData(event.currentTarget)
    
    startTransition(async () => {
      const result = await addMember(formData)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-6 w-6" />
          New Member Registration
        </CardTitle>
        <CardDescription>Add a new client to your gym.</CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 👇 2. PHOTO UPLOAD SECTION */}
          <div className="flex flex-col items-center justify-center mb-6">
            {photoUrl ? (
                // A. Show Preview if image exists
                <div className="relative group">
                    <img 
                        src={photoUrl} 
                        alt="Preview" 
                        className="w-32 h-32 rounded-full object-cover border-4 border-muted shadow-sm"
                    />
                    <button
                        type="button"
                        onClick={() => setPhotoUrl("")}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 hover:bg-destructive/90 transition-colors shadow-md"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ) : (
                // B. Show Upload Button if empty
                <div className="w-full border-2 border-dashed border-muted-foreground/25 rounded-xl bg-muted/5 p-6 flex flex-col items-center justify-center gap-2 hover:bg-muted/10 transition-colors">
                     <UploadButton
                        endpoint="clientImage"
                        onClientUploadComplete={(res) => {
                            if (res?.[0]) {
                                setPhotoUrl(res[0].ufsUrl);
                            }
                        }}
                        onUploadError={(error: Error) => {
                            setError(`Upload failed: ${error.message}`);
                        }}
                        appearance={{
                            button: "bg-primary text-primary-foreground hover:bg-primary/90"
                        }}
                     />
                     <p className="text-xs text-muted-foreground text-center">
                        Upload profile picture (Max 40KB)
                     </p>
                </div>
            )}
            {/* 👇 3. CRITICAL: Hidden Input to send URL to Server Action */}
            <input type="hidden" name="photoUrl" value={photoUrl} />
          </div>
          
          {/* Full Name & WhatsApp */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input id="fullName" name="fullName" placeholder="e.g. Rahul Sharma" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp Number *</Label>
              <Input id="whatsapp" name="whatsapp" placeholder="9876543210" required />
            </div>
          </div>

          {/* Email & Gender */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender *</Label>
              <Select name="gender" required>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Picker */}
          <div className="flex flex-col space-y-2">
            <Label>Date of Birth *</Label>
            <input type="hidden" name="dob" value={dob ? dob.toISOString() : ""}  required/>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-between pl-3 text-left font-normal", 
                    !dob && "text-muted-foreground"
                  )}
                >
                  {dob ? format(dob, "PPP") : <span>Pick a date</span>}
                  <ChevronDownIcon className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dob}
                  onSelect={setDob}
                  disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                  captionLayout="dropdown" 
                  fromYear={1960}                   
                  toYear={new Date().getFullYear()} 
                  classNames={{
                    caption_dropdowns: "flex justify-center gap-1",
                    caption_label: "hidden",
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Plans Dropdown */}
          <div className="space-y-2">
            <Label>Select Plan *</Label>
            <Select name="planId" required>
              <SelectTrigger>
                <SelectValue placeholder="Select a membership..." />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id.toString()}>
                    {plan.name} ({plan.duration} Days)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</div>}
          
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Register Member"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}