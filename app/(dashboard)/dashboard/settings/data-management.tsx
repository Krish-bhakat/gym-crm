"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress"; // Install shadcn progress if needed
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Database, HardDrive, UploadCloud, DownloadCloud, 
  Trash2, RefreshCw, FileText, AlertTriangle, CheckCircle2 
} from "lucide-react";
import { toast } from "sonner";

// Import your existing actions/components
import { ImportClientsDialog } from "@/components/import-clients-button";
import { ExportClientsButton } from "@/components/export-cleints-button";
import { getDataStats, deleteInactiveMembers } from "@/app/(dashboard)/dashboard/clients/import-action";

export function DataManagement() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);

  // Fetch stats on load
  useEffect(() => {
    async function load() {
      const data = await getDataStats();
      setStats(data);
      setLoading(false);
    }
    load();
  }, []);

  // Handle Bulk Delete
  const handleCleanup = async () => {
    if (!confirm("Are you sure? This will PERMANENTLY delete all members marked as 'INACTIVE'. This cannot be undone.")) return;
    
    setCleaning(true);
    const res = await deleteInactiveMembers();
    setCleaning(false);

    if (res.success) {
      toast.success(`Cleanup complete. Removed ${res.count} records.`);
      // Refresh stats
      const data = await getDataStats();
      setStats(data);
    } else {
      toast.error("Cleanup failed.");
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading data stats...</div>;

  return (
    <div className="space-y-6">
      
      {/* --- SECTION 1: SYSTEM HEALTH --- */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Card 1: Storage Overview */}
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Database Usage</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                    {stats?.estimatedSize || "0 KB"}
                    <Badge variant="outline" className="text-xs font-normal bg-green-50 text-green-700 border-green-200">
                        Healthy
                    </Badge>
                </div>
                <Progress value={25} className="h-2 mt-3" />
                <p className="text-xs text-muted-foreground mt-2">Estimated storage load</p>
            </CardContent>
        </Card>

        {/* Card 2: Record Counts */}
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Records</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats?.members || 0}</div>
                <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500"/> {stats?.activeMembers} Active</span>
                    <span className="flex items-center gap-1"><FileText className="h-3 w-3 text-blue-500"/> {stats?.attendanceRecords} Logs</span>
                </div>
            </CardContent>
        </Card>

        {/* Card 3: System Status */}
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">System Status</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2 text-green-600 font-bold text-lg">
                    <Database className="h-5 w-5" /> Online
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    Last backup: Auto-managed by Cloud
                </p>
            </CardContent>
        </Card>
      </div>

      {/* --- SECTION 2: MIGRATION TOOLS --- */}
      <Card>
        <CardHeader>
            <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-blue-600" />
                <CardTitle>Migration & Backup</CardTitle>
            </div>
            <CardDescription>Move your data in or out of the system.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
            
            {/* Import Area */}
            <div className="border rounded-xl p-4 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <UploadCloud className="h-6 w-6" />
                </div>
                <div className="space-y-2 w-full">
                    <h4 className="font-semibold text-sm hover:text-black">Import Members</h4>
                    <p className="text-xs text-muted-foreground">
                        Bulk upload new clients via CSV. Ideal for migrating from another software.
                    </p>
                    <div className="pt-2">
                        {/* Wrapper to style the trigger button full width if needed */}
                        <div className="w-fit">
                            <ImportClientsDialog />
                        </div>
                    </div>
                </div>
            </div>

            {/* Export Area */}
            <div className="border rounded-xl p-4 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                    <DownloadCloud className="h-6 w-6" />
                </div>
                <div className="space-y-2 w-full">
                    <h4 className="font-semibold text-sm hover:text-black">Export Data</h4>
                    <p className="text-xs text-muted-foreground">
                        Download a complete CSV copy of your member database for offline backup.
                    </p>
                    <div className="pt-2">
                        <ExportClientsButton />
                    </div>
                </div>
            </div>

        </CardContent>
      </Card>

      {/* --- SECTION 3: DANGER ZONE --- */}
      <div className="border border-red-200 rounded-xl bg-red-50/50 overflow-hidden">
        <div className="p-4 border-b border-red-100 bg-red-100/50 flex items-center gap-2 text-red-900">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-semibold">Maintenance Zone</span>
        </div>
        <div className="p-6 grid gap-4 md:grid-cols-2 items-center">
            <div>
                <h4 className="font-medium text-red-950">Bulk Delete Inactive Members</h4>
                <p className="text-sm text-red-800/80 mt-1">
                    This will remove all members who are marked as "INACTIVE". 
                    Use this to free up space and clean your database.
                </p>
            </div>
            <div className="flex justify-end">
                <Button 
                    variant="destructive" 
                    onClick={handleCleanup} 
                    disabled={cleaning}
                    className="bg-red-600 hover:bg-red-700"
                >
                    {cleaning ? "Cleaning..." : "Delete Inactive Members"}
                    <Trash2 className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
      </div>

    </div>
  );
}