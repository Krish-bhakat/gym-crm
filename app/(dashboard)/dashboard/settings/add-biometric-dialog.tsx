"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createBiometricDevice } from "./actions"

export function AddBiometricDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const sn = formData.get("sn") as string; // Serial Number is key!

    // Call Server Action
    const result = await createBiometricDevice(name, sn);
    
    if (result.success) {
      toast.success("Device registered!");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to add device");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Scanner
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Register New Device</DialogTitle>
          <DialogDescription>
            Enter the details found on your physical machine.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
                <Label>Device Name</Label>
                <Input name="name" placeholder="e.g. Front Door Scanner" required />
            </div>
            
            <div className="space-y-2">
                <Label>Serial Number (SN)</Label>
                <Input name="sn" placeholder="e.g. CJB234821..." required />
                <p className="text-[11px] text-muted-foreground">
                    This must match the "Serial Number" in the device's System Info exactly.
                </p>
            </div>

            <DialogFooter>
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Register Device
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}