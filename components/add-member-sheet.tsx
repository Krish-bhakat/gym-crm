"use client";

import { useState, useTransition } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus } from "lucide-react";
import { createMember } from "@/app/(dashboard)/dashboard/clients/create-member";

export function AddMemberSheet({ open, onOpenChange }: { open: boolean, onOpenChange: (v: boolean) => void }) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      await createMember(formData);
      onOpenChange(false); // Close on success
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg w-[1000px]]">
        <SheetHeader>
          <SheetTitle>Add New Client</SheetTitle>
          <SheetDescription>Enter details to register a new gym member.</SheetDescription>
        </SheetHeader>
        <form action={handleSubmit} className="space-y-4 ml-3 mr-3 mt-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input name="fullName" required placeholder="John Doe" />
          </div>
          <div className="space-y-2">
            <Label>WhatsApp Number</Label>
            <Input name="whatsapp" required placeholder="+91 98765 43210" />
          </div>
          <div className="space-y-2">
            <Label>Email (Optional)</Label>
            <Input name="email" type="email" placeholder="john@example.com" />
          </div>
          <div className="space-y-2">
            <Label>Plan</Label>
            <Input name="planName" placeholder="e.g. 3 Months Gold" />
          </div>
          <SheetFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <><Plus className="mr-2 h-4 w-4"/> Add Client</>}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}