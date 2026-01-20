"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { addStaff } from "./actions";
import { useRouter } from "next/navigation";

export function AddStaffDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await addStaff(formData);
    
    if (result.success) {
      toast.success("Staff member added successfully");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to add staff");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="shadow-sm">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Staff
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
          <DialogDescription>
            Enter details for trainers, housekeeping, or reception staff.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            
            <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" placeholder="e.g. Rahul Sharma" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="role">Role</Label>
                    <Select name="role" defaultValue="Trainer">
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Trainer">Trainer</SelectItem>
                            <SelectItem value="Reception">Reception</SelectItem>
                            <SelectItem value="Housekeeping">Housekeeping</SelectItem>
                            <SelectItem value="Manager">Manager</SelectItem>
                            <SelectItem value="Security">Security</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                
                <div className="grid gap-2">
                    <Label htmlFor="bioId">Biometric ID</Label>
                    <Input id="bioId" name="bioId" placeholder="e.g. 101" required />
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" placeholder="+91..." required/>
            </div>

            <DialogFooter>
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Staff Member
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}