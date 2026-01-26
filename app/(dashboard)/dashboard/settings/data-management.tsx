"use client";

import { useEffect, useState } from "react";
import Papa from "papaparse";
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter 
} from "@/components/ui/card";
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress"; 
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Database, UploadCloud, DownloadCloud, Trash2, 
  Activity, Server, ShieldAlert, History,
  CheckCircle2, Loader2, FileSpreadsheet, ArrowLeft
} from "lucide-react";
import { toast } from "sonner";

// Import Server Actions
import { 
  getDataStats, 
  deleteInactiveMembers, 
  importMembersWithMap 
} from "@/app/(dashboard)/dashboard/clients/import-action";
import { ExportClientsButton } from "@/components/export-cleints-button"; // Keep this external if it's complex, or I can inline if needed

// --- CONFIGURATION ---
const REQUIRED_FIELDS = [
  { key: 'fullName', label: 'Full Name (Required)', aliases: ['name', 'member', 'student'], required: true },
  { key: 'whatsapp', label: 'Phone/WhatsApp', aliases: ['mobile', 'phone', 'contact'], required: false },
  { key: 'gender', label: 'Gender (M/F)', aliases: ['sex', 'gender'], required: false },
  { key: 'planName', label: 'Plan Name', aliases: ['plan', 'package', 'membership'], required: false },
  { key: 'dob', label: 'Date of Birth', aliases: ['dob', 'birth', 'birthday'], required: false },
  { key: 'joinDate', label: 'Joining Date', aliases: ['date', 'joined', 'start'], required: false },
  { key: 'biometricId', label: 'Biometric ID', aliases: ['bio', 'id', 'device'], required: false },
];

export function DataManagement() {
  // --- DASHBOARD STATE ---
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);

  // --- IMPORT DIALOG STATE ---
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importLoading, setImportLoading] = useState(false);

  // --- 1. LOAD DASHBOARD STATS ---
  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const data = await getDataStats();
    setStats(data);
    setStatsLoading(false);
  }

  // --- 2. CLEANUP ACTION ---
  const handleCleanup = async () => {
    if (!confirm("⚠️ PERMANENT ACTION\n\nAre you sure you want to delete all members marked as 'INACTIVE'?\nThis cannot be undone.")) return;
    
    setCleaning(true);
    const res = await deleteInactiveMembers();
    setCleaning(false);

    if (res.success) {
      toast.success(`Cleanup complete. Removed ${res.count} records.`);
      loadStats(); 
    } else {
      toast.error("Cleanup failed.");
    }
  };

  // --- 3. IMPORT LOGIC ---
  const handleImportOpenChange = (open: boolean) => {
    setIsImportOpen(open);
    // Reset state on close
    if (!open) {
      setTimeout(() => {
        setStep(1);
        setCsvData([]);
        setMapping({});
      }, 300);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvHeaders(results.meta.fields || []);
        setCsvData(results.data);
        autoMapColumns(results.meta.fields || []);
        setStep(2);
      },
      error: (err: any) => toast.error("CSV Error: " + err.message)
    });
    e.target.value = ""; // Allow re-upload
  };

  const autoMapColumns = (headers: string[]) => {
    const newMapping: Record<string, string> = {};
    REQUIRED_FIELDS.forEach((field) => {
      const match = headers.find(header => 
        field.aliases.some(alias => header.toLowerCase().includes(alias))
      );
      if (match) newMapping[field.key] = match;
    });
    setMapping(newMapping);
  };

  const handleFinalImport = async () => {
    const missing = REQUIRED_FIELDS.filter(f => f.required && !mapping[f.key]);
    if (missing.length > 0) {
      toast.error(`Missing required mapping: ${missing[0].label}`);
      return;
    }

    setImportLoading(true);
    try {
      const result = await importMembersWithMap(csvData, mapping);
      if (result.success) {
        toast.success(`Imported ${result.count} members!`);
        setIsImportOpen(false);
        loadStats(); // Refresh dashboard stats
        // Optional: window.location.reload() if you need to refresh other tables
      } else {
        toast.error(result.error || "Import failed");
      }
    } catch (e) {
      toast.error("Import error");
    } finally {
      setImportLoading(false);
    }
  };

  // --- RENDER ---
  if (statsLoading) return (
    <div className="flex h-[400px] items-center justify-center text-muted-foreground animate-pulse">
      <Activity className="mr-2 h-5 w-5" /> Loading System Stats...
    </div>
  );

  return (
    <div className="space-y-8 p-1">
      
      {/* ================= SECTION 1: HEALTH VITALS ================= */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Members */}
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.members || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.activeMembers} currently active</p>
          </CardContent>
        </Card>

        {/* Database Load */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Load</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.estimatedSize || "0 KB"}</div>
            <Progress value={15} className="h-1.5 mt-2 bg-slate-100" indicatorClassName="bg-green-500"/>
          </CardContent>
        </Card>

        {/* Attendance */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Logs</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.attendanceRecords || 0}</div>
            <p className="text-xs text-muted-foreground">Total check-ins stored</p>
          </CardContent>
        </Card>

      </div>


      {/* ================= SECTION 2: ACTIONS ================= */}
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* --- LEFT COLUMN: MIGRATION TOOLS --- */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">Migration & Backup</h3>
            <p className="text-sm text-muted-foreground">Manage data flow in and out of your system.</p>
          </div>
          
          <div className="grid gap-4">
            
            {/* IMPORT DIALOG CARD */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <UploadCloud className="h-5 w-5 text-blue-600" /> Bulk Import
                </CardTitle>
                <CardDescription>
                  Upload a CSV file to add multiple members, plans, and dates at once.
                </CardDescription>
              </CardHeader>
              <CardFooter className="border-t p-4">
                <div className="w-full">
                  
                  {/* === THE IMPORT DIALOG COMPONENT === */}
                  <Dialog open={isImportOpen} onOpenChange={handleImportOpenChange}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        <UploadCloud className="mr-2 h-4 w-4" /> Start CSV Import
                      </Button>
                    </DialogTrigger>
                    
                    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
                      <DialogHeader>
                        <DialogTitle>Import Members</DialogTitle>
                        <DialogDescription>
                          {step === 1 ? "Upload CSV file." : `Found ${csvData.length} rows. Map columns below.`}
                        </DialogDescription>
                      </DialogHeader>

                      <div className="flex-1 overflow-y-auto py-4 px-1">
                        {step === 1 && (
                           <div className="grid place-items-center border-2 border-dashed border-slate-200 rounded-xl p-10 cursor-pointer hover:bg-slate-50 transition-colors relative">
                              <div className="bg-blue-50 p-3 rounded-full mb-4">
                                <FileSpreadsheet className="h-8 w-8 text-slate-400" />
                              </div>
                              <p className="text-sm font-medium hover:text-black">Click to upload CSV</p>
                              <input type="file" accept=".csv" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                           </div>
                        )}

                        {step === 2 && (
                          <div className="space-y-4">
                            <Alert className="bg-blue-50 text-blue-800 border-blue-200">
                              <CheckCircle2 className="h-4 w-4" />
                              <AlertTitle>Smart Match</AlertTitle>
                              <AlertDescription className="text-xs">Verify mappings below.</AlertDescription>
                            </Alert>
                            <div className="grid gap-3">
                              {REQUIRED_FIELDS.map((field) => (
                                <div key={field.key} className="grid grid-cols-12 gap-4 items-center border-b border-slate-100 pb-2">
                                  <div className="col-span-5">
                                    <Label className="text-sm">{field.label}</Label>
                                  </div>
                                  <div className="col-span-7">
                                    <Select 
                                      value={mapping[field.key] || "ignore"} 
                                      onValueChange={(val) => setMapping(prev => ({...prev, [field.key]: val === "ignore" ? "" : val}))}
                                    >
                                      <SelectTrigger className={mapping[field.key] ? "bg-green-50 border-green-200" : ""}>
                                        <SelectValue placeholder="Skip" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="ignore" className="text-muted-foreground italic">-- Skip --</SelectItem>
                                        {csvHeaders.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <DialogFooter className="pt-2 border-t mt-auto">
                        {step === 2 && (
                          <div className="flex w-full gap-2">
                            <Button variant="ghost" onClick={() => setStep(1)} disabled={importLoading}>Back</Button>
                            <Button onClick={handleFinalImport} disabled={importLoading} className="w-full">
                              {importLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Run Import
                            </Button>
                          </div>
                        )}
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  {/* === END IMPORT DIALOG === */}

                </div>
              </CardFooter>
            </Card>

            {/* EXPORT CARD */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <DownloadCloud className="h-5 w-5 text-purple-600" /> Backup Data
                </CardTitle>
                <CardDescription>
                  Download a full CSV copy of your member database for safekeeping.
                </CardDescription>
              </CardHeader>
              <CardFooter className="border-t p-4">
                <div className="w-full">
                  <ExportClientsButton />
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}