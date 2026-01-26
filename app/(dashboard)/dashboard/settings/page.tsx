import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Building2, CreditCard, Fingerprint, MessageSquare } from "lucide-react" // 👈 Added MessageSquare
import { SystemStatus } from "@/components/system-status"
import { ImportClientsDialog } from "@/components/import-clients-button"
import { DataManagement } from "@/app/(dashboard)/dashboard/settings/data-management";
import { 
  Upload, 
  Download, 
  DatabaseBackup,       // 👈 Add this
  FileSpreadsheet // 👈 Add this
} from "lucide-react";
// Components
import { GymProfileForm } from "./general-form"
import { PlanManager } from "./plan-manager"
import { BiometricSettings } from "./biometricpage"
import { SmsManager } from "@/components/sms-manager" // 👈 Import new component

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.email) redirect("/login")

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    include: { gym: true }
  })

  if (!user || !user.gymId) redirect("/login")

  // --- FETCH DATA IN PARALLEL ---
  // We use Promise.all to fetch everything at once for speed
  const [devices, plans, smsSettings] = await Promise.all([
    db.biometricDevice.findMany({
        where: { gymId: user.gymId },
        orderBy: { createdAt: 'desc' }
    }),
    db.plan.findMany({
        where: { gymId: user.gymId },
        orderBy: { duration: 'asc' }
    }),
    // 👇 Fetch SMS Settings
    db.twilioSettings.findUnique({
        where: { gymId: user.gymId }
    })
  ]);

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6 max-w-5xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your gym profile, membership plans, and device settings.
        </p>
      </div>
      <Separator />

      <Tabs defaultValue="general" className="w-full flex flex-col md:flex-row gap-6">
        
        {/* SIDEBAR */}
        <aside className="md:w-1/5">
          <TabsList className="flex flex-col h-auto w-full justify-start gap-1 bg-transparent p-0">
            <TabsTrigger value="general" className="w-full justify-start px-3 py-2 h-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Building2 className="mr-2 h-4 w-4" /> General
            </TabsTrigger>
            <TabsTrigger value="plans" className="w-full justify-start px-3 py-2 h-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <CreditCard className="mr-2 h-4 w-4" /> Plans
            </TabsTrigger>
            <TabsTrigger value="data">
            <DatabaseBackup className="mr-2 h-4 w-4" />Data Management
            </TabsTrigger>
            {/* 👇 NEW NOTIFICATIONS TAB */}
            <TabsTrigger value="notifications" className="w-full justify-start px-3 py-2 h-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <MessageSquare className="mr-2 h-4 w-4" /> Notifications
            </TabsTrigger>

            <TabsTrigger value="integrations" className="w-full justify-start px-3 py-2 h-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Fingerprint className="mr-2 h-4 w-4" /> Biometrics
            </TabsTrigger>
          </TabsList>
        </aside>

        {/* CONTENT */}
        <div className="flex-1">
          
          {/* 1. GENERAL TAB */}
          <TabsContent value="general" className="mt-0 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gym Profile</CardTitle>
                <CardDescription>This information will appear on invoices and messages.</CardDescription>
              </CardHeader>
              <CardContent>
                <GymProfileForm defaultValues={{
                    name: user.gym?.name || "",
                    phoneNumber: user.gym?.phoneNumber || "",
                    address: user.gym?.address || ""
                }} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* 2. PLANS TAB */}
          <TabsContent value="plans" className="mt-0 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Membership Plans</CardTitle>
                <CardDescription>Define the packages you offer to clients.</CardDescription>
              </CardHeader>
              <CardContent>
                <PlanManager plans={plans} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
              <DataManagement />
          </TabsContent>
       

          {/* 👇 3. NEW NOTIFICATIONS TAB */}
          <TabsContent value="notifications" className="mt-0 space-y-4">
             <SmsManager initialSettings={smsSettings} />
          </TabsContent>

          {/* 4. BIOMETRIC TAB */}
          <TabsContent value="integrations" className="space-y-6 mt-0">
            <BiometricSettings devices={devices} />
          </TabsContent>

        </div>
      </Tabs>
    </div>
  )
}