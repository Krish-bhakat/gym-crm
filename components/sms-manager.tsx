"use client";

import { useState } from "react";
import { saveTwilioSettings } from "@/app/(dashboard)/dashboard/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Key, MessageSquare, Cake, Clock, Save, AlertTriangle } from "lucide-react";

interface SmsManagerProps {
  initialSettings?: any;
}

export function SmsManager({ initialSettings }: SmsManagerProps) {
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    // Credentials
    accountSid: initialSettings?.accountSid || "",
    authToken: initialSettings?.authToken || "",
    phoneNumber: initialSettings?.phoneNumber || "",
    
    // Automations
    enableWelcome: initialSettings?.enableWelcome || false,
    welcomeTemplate: initialSettings?.welcomeTemplate || "Welcome to {gym_name}! Your membership is now active.",

    enableBirthday: initialSettings?.enableBirthday || false,
    birthdayTemplate: initialSettings?.birthdayTemplate || "Happy Birthday {member_name}! Have a great day from {gym_name}.",

    enableRenewal: initialSettings?.enableRenewal || false,
    renewalDaysBefore: initialSettings?.renewalDaysBefore || 3,
    renewalTemplate: initialSettings?.renewalTemplate || "Hi {member_name}, your plan at {gym_name} expires in 3 days. Please renew!",
  });

  const handleSave = async () => {
    setSaving(true);
    const result = await saveTwilioSettings(formData);
    setSaving(false);
    
    if (result.success) toast.success("Settings saved successfully!");
    else toast.error("Failed to save settings.");
  };

  return (
    <div className="space-y-8">
      
      {/* --- CARD 1: CONNECT TWILIO --- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" /> 
            Twilio Connection
          </CardTitle>
          <CardDescription>
            Enter your API credentials from the Twilio Console to enable SMS.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Account SID</Label>
              <Input 
                value={formData.accountSid} 
                onChange={(e) => setFormData({...formData, accountSid: e.target.value})}
                placeholder="ACxxxxxxxx..." 
                type="password"
              />
            </div>
            <div className="space-y-2">
              <Label>Auth Token</Label>
              <Input 
                value={formData.authToken} 
                onChange={(e) => setFormData({...formData, authToken: e.target.value})}
                placeholder="Your Auth Token" 
                type="password"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Twilio Phone Number</Label>
            <Input 
              value={formData.phoneNumber} 
              onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
              placeholder="+1234567890" 
            />
          </div>
        </CardContent>
      </Card>

      {/* --- CARD 2: AUTOMATION RULES --- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" /> 
            Automated Rules
          </CardTitle>
          <CardDescription>Configure automatic messages triggered by system events.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <div className="flex">
                <div className="shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                <p className="text-sm text-yellow-700">
                    <strong>Important for Deliverability:</strong>
                    <br/>
                    If you are in a regulated region (India DLT or US A2P), ensure the text below 
                    <strong> exactly matches</strong> your approved templates. 
                    Mismatched templates will cause SMS delivery failure.
                </p>
                </div>
            </div>
            </div>

            {/* RULE A: WELCOME MESSAGE */}
            <div className="flex flex-col gap-4 border p-4 rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label className="text-base font-semibold">Welcome Message</Label>
                        <p className="text-sm text-muted-foreground">Sent immediately when you add a new member.</p>
                    </div>
                    <Switch 
                        checked={formData.enableWelcome}
                        onCheckedChange={(c) => setFormData({...formData, enableWelcome: c})}
                    />
                </div>
                {formData.enableWelcome && (
                    <Textarea 
                        value={formData.welcomeTemplate}
                        onChange={(e) => setFormData({...formData, welcomeTemplate: e.target.value})}
                        className="h-20 text-sm"
                        placeholder="Welcome to {gym_name}..."
                    />
                )}
            </div>

            {/* RULE B: BIRTHDAY WISH */}
            <div className="flex flex-col gap-4 border p-4 rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label className="text-base font-semibold flex items-center gap-2"><Cake className="h-4 w-4 text-pink-500"/> Birthday Wish</Label>
                        <p className="text-sm text-muted-foreground">Sent at 9:00 AM on the member's birthday.</p>
                    </div>
                    <Switch 
                        checked={formData.enableBirthday}
                        onCheckedChange={(c) => setFormData({...formData, enableBirthday: c})}
                    />
                </div>
                {formData.enableBirthday && (
                    <Textarea 
                        value={formData.birthdayTemplate}
                        onChange={(e) => setFormData({...formData, birthdayTemplate: e.target.value})}
                        className="h-20 text-sm"
                    />
                )}
            </div>

            {/* RULE C: RENEWAL REMINDER */}
            <div className="flex flex-col gap-4 border p-4 rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label className="text-base font-semibold flex items-center gap-2"><Clock className="h-4 w-4 text-orange-500"/> Renewal Reminder</Label>
                        <p className="text-sm text-muted-foreground">Sent a few days before their plan expires.</p>
                    </div>
                    <Switch 
                        checked={formData.enableRenewal}
                        onCheckedChange={(c) => setFormData({...formData, enableRenewal: c})}
                    />
                </div>
                {formData.enableRenewal && (
                    <div className="space-y-3">
                         <div className="flex items-center gap-2 text-sm p-2 rounded ">
                            <span>Send</span>
                            <Input 
                                type="number" 
                                className="w-14 h-8 text-center"
                                value={formData.renewalDaysBefore}
                                onChange={(e) => setFormData({...formData, renewalDaysBefore: Number(e.target.value)})}
                            />
                            <span>days before expiry</span>
                        </div>
                        <Textarea 
                            value={formData.renewalTemplate}
                            onChange={(e) => setFormData({...formData, renewalTemplate: e.target.value})}
                            className="h-20 text-sm"
                        />
                    </div>
                )}
            </div>

        </CardContent>
      </Card>

      {/* FOOTER SAVE BUTTON */}
      <div className="flex justify-end sticky bottom-6">
        <Button size="lg" onClick={handleSave} disabled={saving} className="shadow-lg">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save All Changes
        </Button>
      </div>

    </div>
  );
}