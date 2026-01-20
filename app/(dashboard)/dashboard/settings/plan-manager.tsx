"use client";

import { useState } from "react";
import { createPlan, deletePlan } from "@/app/(dashboard)/dashboard/settings/actions"; // Ensure this path is correct
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Clock, Check, Banknote, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Helper to format currency (change 'INR' to 'USD' if needed)
const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

// Helper to display duration nicely
const formatDuration = (days: number) => {
  if (days === 30) return "Monthly";
  if (days === 90) return "Quarterly";
  if (days === 180) return "Half Yearly";
  if (days === 365) return "Yearly";
  return `${days} Days`;
};

export function PlanManager({ plans }: { plans: any[] }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    duration: "30", // Default to 1 month
  });

  // Smart duration presets
  const setPresetDuration = (days: string) => {
    setFormData({ ...formData, duration: days });
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.price || !formData.duration) {
        toast.error("Please fill in all fields");
        return;
    }

    setLoading(true);
    // Convert strings to numbers for the Server Action
    const result = await createPlan({
        name: formData.name,
        price: Number(formData.price),
        duration: Number(formData.duration)
    });
    
    setLoading(false);

    if (result.success) {
      toast.success("Plan created successfully!");
      setFormData({ name: "", price: "", duration: "30" }); // Reset form
      setIsDialogOpen(false);
    } else {
      toast.error("Failed to create plan.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this plan? Members currently on this plan will not be affected.")) return;
    await deletePlan(id);
    toast.success("Plan deleted.");
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER ACTION */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm text-muted-foreground">
          You have {plans.length} active membership plans.
        </h3>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Membership</DialogTitle>
              <DialogDescription>
                Create a new package for your gym members.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-6 py-4">
              
              {/* Name Input */}
              <div className="space-y-2">
                <Label>Plan Name</Label>
                <Input 
                  placeholder="e.g. Gold Membership" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              {/* Price Input */}
              <div className="space-y-2">
                <Label>Price (₹)</Label>
                <div className="relative">
                    <Banknote className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="number" 
                      className="pl-9"
                      placeholder="1000"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                    />
                </div>
              </div>

              {/* Duration Selector */}
              <div className="space-y-3">
                <Label>Duration</Label>
                <Tabs value={String(formData.duration)} onValueChange={setPresetDuration} className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="30">1 Mo</TabsTrigger>
                    <TabsTrigger value="90">3 Mo</TabsTrigger>
                    <TabsTrigger value="180">6 Mo</TabsTrigger>
                    <TabsTrigger value="365">1 Yr</TabsTrigger>
                  </TabsList>
                </Tabs>
                
                <div className="flex items-center gap-2 mt-2">
                   <span className="text-xs text-muted-foreground">Or custom days:</span>
                   <Input 
                      type="number" 
                      className="w-20 h-8 text-xs"
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: e.target.value})}
                   />
                </div>
              </div>

            </div>

            <DialogFooter>
              <Button onClick={handleCreate} disabled={loading} className="w-full">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Plan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* PLANS GRID DISPLAY */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <Card key={plan.id} className="relative overflow-hidden group hover:border-primary/50 transition-all">
            <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => handleDelete(plan.id)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
            
            <CardHeader className="pb-2">
              <Badge variant="secondary" className="w-fit mb-2 font-normal text-xs bg-blue-50 text-blue-700 hover:bg-blue-50">
                <Clock className="mr-1 h-3 w-3" />
                {formatDuration(plan.duration)}
              </Badge>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {formatPrice(plan.price)}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                   / {plan.duration > 300 ? 'year' : 'month'}
                </span>
              </div>
            </CardContent>

            <CardFooter className="bg-muted/50 p-3">
               <div className="text-xs text-muted-foreground flex items-center gap-1 w-full justify-center">
                  <Check className="h-3 w-3 text-green-600" /> Active Plan
               </div>
            </CardFooter>
          </Card>
        ))}
        
        {/* Empty State */}
        {plans.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-muted/10 text-muted-foreground">
                <p>No plans found. Create your first membership package above.</p>
            </div>
        )}
      </div>

    </div>
  );
}