"use client";

import { useState } from "react";
import Papa from "papaparse";
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UploadCloud, CheckCircle2, Loader2, FileSpreadsheet, AlertTriangle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { importMembersWithMap } from "@/app/(dashboard)/dashboard/clients/import-action"; 

// Match strict backend keys
const REQUIRED_FIELDS = [
  { key: 'fullName', label: 'Full Name (Required)', aliases: ['name', 'member', 'student', 'client'], required: true },
  { key: 'whatsapp', label: 'Phone/WhatsApp', aliases: ['mobile', 'phone', 'contact', 'cell', 'whatsapp'], required: false },
  { key: 'gender', label: 'Gender (M/F)', aliases: ['sex', 'gender'], required: false },
  { key: 'biometricId', label: 'Biometric ID', aliases: ['bio', 'id', 'device', 'fingerprint'], required: false },
  { key: 'email', label: 'Email', aliases: ['mail', 'e-mail'], required: false },
  { key: 'joinDate', label: 'Joining Date', aliases: ['date', 'joined', 'start', 'created'], required: false },
];

export function DataManagement() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Reset state when closing dialog
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
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
        const headers = results.meta.fields || [];
        setCsvHeaders(headers);
        setCsvData(results.data);
        autoMapColumns(headers);
        setStep(2);
      },
      error: (err: any) => toast.error("CSV Error: " + err.message)
    });
    
    // Reset input so same file can be selected again if needed
    e.target.value = ""; 
  };

  const autoMapColumns = (headers: string[]) => {
    const newMapping: Record<string, string> = {};
    REQUIRED_FIELDS.forEach((field) => {
      // Find a header that roughly matches our aliases
      const match = headers.find(header => 
        field.aliases.some(alias => header.toLowerCase().includes(alias))
      );
      if (match) newMapping[field.key] = match;
    });
    setMapping(newMapping);
  };

  const handleFinalImport = async () => {
    // Validation: Ensure required fields are mapped
    const missingRequired = REQUIRED_FIELDS.filter(f => f.required && !mapping[f.key]);
    if (missingRequired.length > 0) {
      toast.error(`Please map the following required fields: ${missingRequired.map(f => f.label).join(", ")}`);
      return;
    }

    setLoading(true);
    try {
      // Send raw data + the mapping guide to the server
      const result = await importMembersWithMap(csvData, mapping);
      
      if (result.success) {
        toast.success(`Success! Imported ${result.count} members.`);
        setIsOpen(false);
        // Force refresh to show new data
        window.location.reload(); 
      } else {
        toast.error(result.error || "Import failed");
      }
    } catch (e) {
      toast.error("Something went wrong during import");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UploadCloud className="mr-2 h-4 w-4" /> Import CSV
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Members</DialogTitle>
          <DialogDescription>
            {step === 1 
              ? "Upload your member list (CSV format)." 
              : `Found ${csvData.length} rows. Please map your columns below.`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 px-1">
          {step === 1 && (
             <div className="grid place-items-center border-2 border-dashed border-slate-200 rounded-xl p-10 cursor-pointer hover:bg-slate-50 transition-colors relative">
                <div className="bg-blue-50 p-3 rounded-full mb-4">
                  <FileSpreadsheet className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-slate-900">Click to browse or drag file here</p>
                <p className="text-xs text-slate-500 mt-1">Supports .csv files</p>
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={handleFileUpload} 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                />
             </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <Alert className="bg-blue-50 text-blue-800 border-blue-200">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Smart Match Active</AlertTitle>
                <AlertDescription className="text-xs">
                  We have auto-selected columns that look similar. Please verify the <b>Full Name</b> field.
                </AlertDescription>
              </Alert>

              <div className="grid gap-4">
                {REQUIRED_FIELDS.map((field) => {
                  const isMapped = !!mapping[field.key];
                  return (
                    <div key={field.key} className="grid grid-cols-12 gap-4 items-center border-b border-slate-100 pb-3 last:border-0">
                      <div className="col-span-5">
                        <Label className="text-sm font-medium">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </Label>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Destination Field
                        </p>
                      </div>
                      
                      <div className="col-span-7">
                        <Select 
                          value={mapping[field.key] || "ignore"} 
                          onValueChange={(val) => setMapping(prev => ({...prev, [field.key]: val === "ignore" ? "" : val}))}
                        >
                          <SelectTrigger className={isMapped ? "border-green-500 bg-green-50/50 ring-0 focus:ring-0" : "text-muted-foreground"}>
                            <SelectValue placeholder="Skip this field" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ignore" className="text-muted-foreground italic">
                              -- Skip / Do Not Import --
                            </SelectItem>
                            {csvHeaders.map(h => (
                              <SelectItem key={h} value={h} className="font-medium">
                                {h}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t mt-auto">
          {step === 2 ? (
            <>
              <Button variant="ghost" onClick={() => setStep(1)} disabled={loading}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={handleFinalImport} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                {loading ? "Importing..." : "Run Import"}
              </Button>
            </>
          ) : (
             <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}