"use client";

import { useTransition, useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { UploadButton } from "@/lib/uploadthing"; // 👈 Ensure this path is correct
import { updateMember } from "@/app/(dashboard)/dashboard/clients/update_member_actions";

interface Plan {
  id: number;
  name: string;
  duration: number;
}

interface EditMemberSheetProps {
  member: any; 
  open: boolean;
  plans: Plan[];
  onOpenChange: (open: boolean) => void;
}

export function EditMemberSheet({ member, open, plans, onOpenChange }: EditMemberSheetProps) {
  const [isPending, startTransition] = useTransition();
  
  // 1. State for Photo & DOB
  const [photoUrl, setPhotoUrl] = useState("");
  const [dob, setDob] = useState<Date | undefined>(undefined);

  // 2. Sync state when member changes
  useEffect(() => {
    if (member) {
      setPhotoUrl(member.photoUrl || "");
      setDob(member.dob ? new Date(member.dob) : undefined);
    }
  }, [member]);

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      await updateMember(member.id, formData);
      onOpenChange(false);
    });
  };

  if (!member) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[400px] w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Client Details</SheetTitle>
          <SheetDescription>Make changes to {member.fullName}'s profile.</SheetDescription>
        </SheetHeader>
        
        <form action={handleSubmit} className="space-y-6 mt-6">
          
          {/* 👇 3. PHOTO UPLOAD SECTION */}
          <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-muted/10">
            {photoUrl ? (
              <div className="relative group">
                <img 
                  src={photoUrl} 
                  alt="Preview" 
                  className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-md" 
                />
                <button
                  type="button"
                  onClick={() => setPhotoUrl("")}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-sm"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="text-center transform scale-90 origin-top">
                <UploadButton
                  endpoint="clientImage"
                  onClientUploadComplete={(res) => {
                    if (res?.[0]) setPhotoUrl(res[0].ufsUrl);
                  }}
                  onUploadError={(error: Error) => {
                    alert("Upload failed");
                  }}
                  appearance={{
                     button: "bg-primary text-primary-foreground hover:bg-primary/90"
                  }}
                />
                <p className="text-xs text-muted-foreground mt-2">Update Profile Picture</p>
              </div>
            )}
            {/* Hidden input to pass URL to server action */}
            <input type="hidden" name="photoUrl" value={photoUrl} />
          </div>

          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input name="fullName" defaultValue={member.fullName} required />
          </div>
          
          {/* 👇 4. DATE OF BIRTH SECTION */}
          <div className="space-y-2">
            <Label>Date of Birth</Label>
            <div className="relative">
              <input type="hidden" name="dob" value={dob ? dob.toISOString() : ""} />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dob && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dob ? format(dob, "PPP") : <span>Pick a date</span>}
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
          </div>

          <div className="space-y-2">
            <Label>WhatsApp (Required)</Label>
            <Input name="whatsapp" defaultValue={member.whatsapp} required />
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input name="email" defaultValue={member.email || ""} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Current Plan</Label>
              <Select name="planId"> 
                <SelectTrigger>
                  <SelectValue placeholder={member.planName || "Select a Plan"} />
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
            
            <div className="space-y-2">
              <Label>Status</Label>
              <Select name="status" defaultValue={member.status}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Biometric ID (From Machine)</Label>
            <Input 
              name="biometricId" 
              placeholder="e.g. 101" 
              defaultValue={member.biometricId || ""} 
            />
            <p className="text-xs text-muted-foreground">
              Enter the User ID exactly as it appears in the fingerprint scanner.
            </p>
          </div>

          <SheetFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Save Changes"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}