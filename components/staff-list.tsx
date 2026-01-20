"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Briefcase, Fingerprint, Phone, Trash2, Clock } from "lucide-react";
import { deleteStaff } from "@/app/(dashboard)/dashboard/staff/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

interface StaffListProps {
  staff: any[]; // Use proper Prisma type if available
}

export function StaffList({ staff }: StaffListProps) {
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const router = useRouter();

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure? This will delete their attendance history too.")) return;
    
    setLoadingId(id);
    const res = await deleteStaff(id);
    
    if (res.success) {
      toast.success("Staff member removed");
      router.refresh();
    } else {
      toast.error(res.error);
    }
    setLoadingId(null);
  };

  if (staff.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-xl bg-slate-50/50">
        <div className="mx-auto h-12 w-12 text-muted-foreground/50">
          <Briefcase className="h-full w-full" />
        </div>
        <h3 className="mt-2 text-sm font-semibold text-slate-900">No staff members</h3>
        <p className="mt-1 text-sm text-muted-foreground">Get started by creating a new employee.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {staff.map((employee) => {
        // Initials for Avatar
        const initials = employee.fullName.split(" ").map((n:string) => n[0]).join("").substring(0,2).toUpperCase();
        
        // Last Seen Logic
        const lastSeen = employee.attendance[0]?.checkIn;
        const isOnline = lastSeen && (new Date().getTime() - new Date(lastSeen).getTime() < 12 * 60 * 60 * 1000); // Seen in last 12 hours

        return (
          <Card key={employee.id} className="group hover:shadow-md transition-all duration-200">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <CardTitle className="text-base font-bold truncate">
                    {employee.fullName}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs font-normal">
                        {employee.role}
                    </Badge>
                    {isOnline && (
                        <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" title="Checked in today"/>
                    )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="grid gap-2.5 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground bg-slate-50 p-2 rounded-md">
                <Fingerprint className="h-4 w-4 text-slate-500" />
                <span className="font-mono text-xs font-medium text-slate-700">ID: {employee.biometricId}</span>
              </div>
              
              {employee.phoneNumber && (
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{employee.phoneNumber}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {lastSeen 
                        ? `Last seen ${formatDistanceToNow(new Date(lastSeen))} ago` 
                        : "Never checked in"}
                  </span>
              </div>
            </CardContent>

            <CardFooter className="pt-2 border-t bg-slate-50/30 flex justify-between items-center">
               <span className="text-xs text-muted-foreground font-medium">
                 {employee._count.attendance} days worked
               </span>
               <Button 
                 variant="ghost" 
                 size="sm" 
                 className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                 onClick={() => handleDelete(employee.id)}
                 disabled={loadingId === employee.id}
               >
                 {loadingId === employee.id ? "..." : <Trash2 className="h-4 w-4" />}
               </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}