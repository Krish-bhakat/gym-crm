"use client"

import { useState } from "react"
import Papa from "papaparse" 
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileUp, Loader2, ArrowRight, CheckCircle, RefreshCcw } from "lucide-react"
import { toast } from "sonner"
import { importMembersWithMap } from "@/app/(dashboard)/dashboard/clients/import-action"

// Define what fields your database needs
const SYSTEM_FIELDS = [
  { key: "fullName", label: "Full Name (Required)", required: true },
  { key: "biometricId", label: "Biometric ID (Required)", required: true },
  { key: "whatsapp", label: "Phone / WhatsApp", required: false },
  { key: "gender", label: "Gender", required: false },
  { key: "email", label: "Email", required: false },
]

export function ImportClientsDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<any[]>([])
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  
  const [step, setStep] = useState<1 | 2>(1) // 1 = Upload, 2 = Map
  const [loading, setLoading] = useState(false)

  const reset = () => {
    setFile(null)
    setParsedData([])
    setCsvHeaders([])
    setColumnMapping({})
    setStep(1)
  }

  // 1. Generate Template (Updated to include Biometric ID)
  const downloadTemplate = () => {
    const headers = ["fullName,biometricId,whatsapp,email,gender"]
    const example = ["John Doe,101,9876543210,john@example.com,MALE"]
    const csvContent = "data:text/csv;charset=utf-8," + headers.join("\n") + "\n" + example.join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "gym_import_template.csv")
    document.body.appendChild(link)
    link.click()
  }

  // 2. Handle File & Parse Headers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || []
        setCsvHeaders(headers)
        setParsedData(results.data)
        
        // Auto-match columns if names are identical (smart feature)
        const initialMap: Record<string, string> = {}
        SYSTEM_FIELDS.forEach(field => {
            const match = headers.find(h => h.toLowerCase() === field.key.toLowerCase())
            if (match) initialMap[field.key] = match
        })
        setColumnMapping(initialMap)
        
        setStep(2) // Move to Mapping Step
      },
      error: () => toast.error("Error reading CSV file")
    })
  }

  // 3. Submit with Map
  const handleImport = async () => {
    if (!parsedData.length) return
    
    // Validate Required Fields
    if (!columnMapping.fullName || !columnMapping.biometricId) {
        toast.error("Please map 'Full Name' and 'Biometric ID' columns.")
        return
    }

    setLoading(true)
    
    // Pass the data AND the map to the backend
    const result = await importMembersWithMap(parsedData, columnMapping)

    setLoading(false)
    if (result.success) {
      toast.success(`Success! Imported ${result.count} members.`)
      setIsOpen(false)
      reset()
    } else {
      toast.error(result.error || "Import failed")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(val) => { setIsOpen(val); if(!val) reset(); }}>
      <DialogTrigger asChild>
            <Button className="w-full text-black border">
                <Upload className="mr-2 h-4 w-4" /> Import Members
            </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{step === 1 ? "Upload CSV" : "Map Columns"}</DialogTitle>
          <DialogDescription>
            {step === 1 ? "Upload your client list to migrate data." : "Match your Excel columns to our system fields."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          
          {/* --- STEP 1: UPLOAD --- */}
          {step === 1 && (
            <>
                <div className="p-3 rounded-md border text-sm flex justify-between items-center bg-slate-50">
                    <span className="text-slate-600">Don't know the format?</span>
                    <Button variant="link" size="sm" onClick={downloadTemplate} className="text-blue-600 h-auto p-0">
                        Download Template
                    </Button>
                </div>

                <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center relative hover:bg-slate-50 transition">
                    <input 
                        type="file" 
                        accept=".csv" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleFileChange}
                    />
                    <FileUp className="h-10 w-10 text-slate-400 mb-3" />
                    <p className="text-sm font-medium">Click to Upload CSV</p>
                    <p className="text-xs text-muted-foreground mt-1">Supports Excel CSV format</p>
                </div>
            </>
          )}

          {/* --- STEP 2: MAPPING --- */}
          {step === 2 && (
            <div className="space-y-4">
                <div className="flex items-center justify-between text-sm text-slate-500 pb-2 border-b">
                    <span>System Field</span>
                    <span>Your CSV Column</span>
                </div>
                
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {SYSTEM_FIELDS.map((field) => (
                        <div key={field.key} className="grid grid-cols-2 items-center gap-4">
                            <label className="text-sm font-medium">
                                {field.label}
                                {field.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            
                            <Select 
                                value={columnMapping[field.key] || ""} 
                                onValueChange={(val) => setColumnMapping(prev => ({ ...prev, [field.key]: val }))}
                            >
                                <SelectTrigger className="h-8">
                                    <SelectValue placeholder="Select column..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {csvHeaders.map((header) => (
                                        <SelectItem key={header} value={header}>{header}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ))}
                </div>

                <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-xs flex gap-2">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <p>We found <strong>{parsedData.length}</strong> rows. Click Import to finish.</p>
                </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:justify-between">
           {step === 2 && (
               <Button variant="ghost" onClick={reset}>
                   <RefreshCcw className="mr-2 h-4 w-4" /> Reset
               </Button>
           )}
           <Button onClick={handleImport} disabled={loading || step === 1} className="w-full sm:w-auto ml-auto">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (
                    <>
                        Start Import <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                )}
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}