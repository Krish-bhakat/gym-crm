"use client";

import { useState } from "react";
import Papa from "papaparse"; // Run: npm i papaparse
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UploadCloud, CheckCircle } from "lucide-react";
import { importMembersWithMap } from "@/app/(dashboard)/dashboard/clients/import-action"; // We will create this next

// These are the fields YOUR database needs
const REQUIRED_FIELDS = [
  { key: "fullName", label: "Full Name (Required)" },
  { key: "whatsapp", label: "Phone / WhatsApp" },
  { key: "biometricId", label: "Biometric ID (Enroll ID)" },
  { key: "gender", label: "Gender (M/F)" },
  { key: "email", label: "Email (Optional)" },
];

export function CsvImporter() {
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1); // 1=Upload, 2=Map, 3=Done

  // 1. Parse the File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setFileHeaders(results.meta.fields || []);
        setCsvData(results.data);
        setStep(2); // Move to Mapping Step
      },
    });
  };

  // 2. Submit with the Map
  const handleImport = async () => {
    const result = await importMembersWithMap(csvData, columnMap);
    if (result.success) {
        setStep(3); // Success Screen
    } else {
        alert("Error: " + result.error);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild><Button>Import Members</Button></DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader><DialogTitle>Bulk Import Members</DialogTitle></DialogHeader>

        {/* STEP 1: UPLOAD */}
        {step === 1 && (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl bg-slate-50">
            <UploadCloud className="h-10 w-10 text-slate-400 mb-2" />
            <input type="file" accept=".csv" onChange={handleFileUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
          </div>
        )}

        {/* STEP 2: MAP COLUMNS */}
        {step === 2 && (
            <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Match your Excel columns to our fields.</p>
                <div className="grid gap-3 max-h-[300px] overflow-y-auto p-1">
                    {REQUIRED_FIELDS.map((field) => (
                        <div key={field.key} className="grid grid-cols-2 items-center gap-4">
                            <span className="text-sm font-medium">{field.label}</span>
                            <Select 
                                onValueChange={(val) => setColumnMap(prev => ({ ...prev, [field.key]: val }))}
                            >
                                <SelectTrigger><SelectValue placeholder="Select Column..." /></SelectTrigger>
                                <SelectContent>
                                    {fileHeaders.map((header) => (
                                        <SelectItem key={header} value={header}>{header}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ))}
                </div>
                <Button onClick={handleImport} className="w-full">Start Import</Button>
            </div>
        )}

        {/* STEP 3: SUCCESS */}
        {step === 3 && (
            <div className="text-center py-6">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <h3 className="text-lg font-bold">Import Complete!</h3>
                <p className="text-sm text-muted-foreground">Your members have been added.</p>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}