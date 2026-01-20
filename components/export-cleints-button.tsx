"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ExportClientsButton() {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/export/clients");
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gym_clients_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Export downloaded successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to download export.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      // 👇 Key Change: Added hover state and defined border color explicitly
      className="bg-slate-400 text-white border border-gray-200 hover:bg-gray-1000 transition-colors"
      variant="outline" 
      size="lg" // Matches your other header buttons better than "lg"
      onClick={handleExport} 
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      Export CSV
    </Button>
  );
}