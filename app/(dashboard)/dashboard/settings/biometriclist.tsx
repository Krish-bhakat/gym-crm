"use client";

import { useState, useTransition } from "react";
import { 
  Trash2, Monitor, AlertCircle, RefreshCw, CheckCircle2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card";
import { deleteBiometricDevice } from "./actions"; // We will create this next
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

interface BiometricListProps {
  devices: any[]; // Replace 'any' with your Prisma type if available
}

export function BiometricList({ devices }: BiometricListProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this device?")) return;

    startTransition(async () => {
      const result = await deleteBiometricDevice(id);
      if (result.success) {
        toast.success("Device removed successfully");
        router.refresh(); // Reloads the list
      } else {
        toast.error("Failed to remove device");
      }
    });
  };

  if (devices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl bg-slate-50 text-slate-400">
        <Monitor className="h-10 w-10 mb-2 opacity-50" />
        <p className="font-medium">No devices registered</p>
        <p className="text-xs">Click "Add Scanner" to connect your first machine.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {devices.map((device) => {
        // Logic to determine if "Online" (e.g., seen in last 5 mins)
        // Note: Ensure your DB has a 'lastSeen' field, otherwise remove this logic.
        const isOnline = device.lastSeen 
            ? new Date(device.lastSeen).getTime() > Date.now() - 5 * 60 * 1000 
            : false;

        return (
          <div 
            key={device.id} 
            className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-sm transition-all group"
          >
            {/* Left: Icon & Info */}
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${isOnline ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-500"}`}>
                <Monitor className="h-5 w-5" />
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm">{device.name}</h4>
                    {isOnline ? (
                        <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200 h-5 px-1.5 gap-1">
                           <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Online
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-500 h-5 px-1.5">
                           Offline
                        </Badge>
                    )}
                </div>
                
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground font-mono">
                    <span>SN: {device.id}</span> {/* Using ID as SN based on previous logic */}
                    {device.lastSeen && (
                        <span>• Last seen {formatDistanceToNow(new Date(device.lastSeen))} ago</span>
                    )}
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-red-500 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleDelete(device.id)}
                disabled={isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}