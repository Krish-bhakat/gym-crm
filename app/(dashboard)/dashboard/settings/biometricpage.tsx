"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Fingerprint, Server, Radio, Info, CheckCircle2, 
  Copy, ExternalLink, AlertTriangle 
} from "lucide-react";
import { toast } from "sonner";
import { BiometricList } from "./biometriclist"; 
// You'll need an "Add Device" dialog. I'll provide the code for this below if you don't have it.
import { AddBiometricDialog } from "./add-biometric-dialog"; 

interface BiometricSettingsProps {
  devices: any[]; // Data from DB
}

export function BiometricSettings({ devices }: BiometricSettingsProps) {
  
  // 1. Determine the Base Domain
  // ESSL machines often need just the domain if they append /iclock/cdata automatically
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://your-app.com";
  const fullUrl = `${appUrl}/api/biometric/check-in`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("URL copied to clipboard");
  };

  return (
    <div className="space-y-8">
      
      {/* --- SECTION 1: SERVER CONFIGURATION CARD --- */}
      <Card className="bg-slate-950 text-white border-slate-800 shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
            <Server className="w-32 h-32" />
        </div>
        
        <CardHeader className="relative z-10">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                <Server className="h-6 w-6" />
            </div>
            <div>
                <CardTitle className="text-xl">Server Configuration</CardTitle>
                <CardDescription className="text-slate-400">
                    Enter these details into your biometric machine's "Cloud Server" or "ADMS" menu.
                </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 space-y-6">
            
            {/* The URL Display */}
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Primary Server URL
                    </span>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 p-3 bg-slate-900 rounded border border-slate-800 font-mono text-sm break-all text-blue-300">
                            {fullUrl}
                        </code>
                        <Button variant="outline" size="icon" className="border-slate-700 hover:bg-slate-800 hover:text-white" onClick={() => copyToClipboard(fullUrl)}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                    <p className="text-[10px] text-slate-500">
                        *Use this for newer machines that allow custom paths.
                    </p>
                </div>

                <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Alternative (Old Devices)
                    </span>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 p-3 bg-slate-900 rounded border border-slate-800 font-mono text-sm break-all text-purple-300">
                            {appUrl}
                        </code>
                        <Button variant="outline" size="icon" className="border-slate-700 hover:bg-slate-800 hover:text-white" onClick={() => copyToClipboard(appUrl)}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                    <p className="text-[10px] text-slate-500">
                        *Use this if your machine forces the path to be <code>/iclock/cdata</code>.
                    </p>
                </div>
            </div>

            {/* Status & Port Info */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-sm">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-slate-300">
                        <Server className="h-4 w-4" /> Port: <span className="font-mono text-white">443 (HTTPS)</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" /> 
                        Domain: <span className="font-mono text-white">ON</span>
                    </div>
                </div>
                
                <Badge variant="outline" className="border-green-800 text-green-400 bg-green-950/30 px-3 py-1">
                    <Radio className="h-3 w-3 mr-2 animate-pulse" /> Listening for connections
                </Badge>
            </div>

        </CardContent>
      </Card>

      {/* --- SECTION 2: SETUP GUIDE (Updated for ESSL) --- */}
      <div className="grid gap-6 lg:grid-cols-3">
          
          {/* Instructions Column */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" /> Setup Instructions
            </h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
                {[
                    { step: 1, title: "Find Serial Number", desc: "Look at the back of your device or go to Menu > System Info. Write down the SN (e.g., CJB123...)." },
                    { step: 2, title: "Register Device", desc: "Click the 'Add Device' button on this page and enter that Serial Number exactly as it appears." },
                    { step: 3, title: "Configure Network", desc: "On the device, go to Menu > Comm > Cloud Server. Enter the Server URL from the black card above." },
                    { step: 4, title: "Reboot & Test", desc: "Restart the device. The globe icon should turn green. Try checking in!" }
                ].map((item) => (
                    <Card key={item.step} className="relative overflow-hidden border-l-4 border-l-primary shadow-sm hover:shadow-md transition">
                        <CardHeader className="pb-2">
                            <span className="text-xs font-bold uppercase text-muted-foreground mb-1">Step 0{item.step}</span>
                            <CardTitle className="text-base">{item.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {item.desc}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Alert className="bg-amber-50 text-amber-900 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle>Troubleshooting</AlertTitle>
                <AlertDescription className="text-xs mt-1">
                    If the device fails to connect, try using <strong>HTTP (Port 80)</strong> instead of HTTPS. Some older ZKTeco/ESSL models do not support SSL certificates.
                </AlertDescription>
            </Alert>
          </div>

          {/* --- SECTION 3: DEVICE LIST & ACTIONS --- */}
          <div className="space-y-6">
             <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Fingerprint className="h-5 w-5" /> Your Devices
                </h3>
                {/* The Add Button */}
                <AddBiometricDialog /> 
             </div>
             
             {/* Pass your existing device list here */}
             <div className="bg-white rounded-xl border shadow-sm min-h-[300px]">
                 <BiometricList devices={devices} />
             </div>
          </div>

      </div>
    </div>
  );
}