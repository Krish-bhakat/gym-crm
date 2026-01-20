export const dynamic = "force-dynamic";
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"

// Components
import { SectionCards } from "@/components/section-cards"
import { DataTable } from "@/components/data-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

import { AlertTriangle, Cake, Fingerprint, UserPlus, CreditCard, Briefcase } from "lucide-react"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.email) redirect("/login")

  const user = await db.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user?.gymId) redirect("/login")

  // --- 1. DATES & RANGES ---
  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const nextWeek = new Date()
  nextWeek.setDate(today.getDate() + 7)

  // --- 2. FETCH DATA IN PARALLEL ---
  const [
    totalCount, 
    activeCount, 
    newCount, 
    rawAttendance,
    expiringMembers,
    allActiveMembers,
    rawRecentMembers,
    plans,
    
    // 👇 NEW: Fetch Staff Stats
    staffPresentCount
  ] = await Promise.all([
    db.member.count({ where: { gymId: user.gymId } }),
    db.member.count({ where: { gymId: user.gymId, status: "ACTIVE" } }),
    db.member.count({ where: { gymId: user.gymId, createdAt: { gte: firstDayOfMonth } } }),
    
    // Member Attendance
    db.attendance.findMany({
      where: { 
        member: { gymId: user.gymId },
        checkIn: { gte: startOfToday }
      },
      include: { member: true },
      orderBy: { checkIn: 'desc' }, 
      take: 100 
    }),

    // Expiring
    db.member.findMany({
      where: { 
        gymId: user.gymId, 
        status: "ACTIVE", 
        endDate: { gte: today, lte: nextWeek }
      },
      orderBy: { endDate: 'asc' },
      take: 10
    }),

    // Birthdays source
    db.member.findMany({
      where: { gymId: user.gymId, status: "ACTIVE" },
      select: { id: true, fullName: true, photoUrl: true, dob: true, whatsapp: true }
    }),

    // Recent Members Table
    db.member.findMany({
      where: { gymId: user.gymId },
      include: { plan: true }, 
      orderBy: { createdAt: 'desc' },
      take: 10 
    }),

    db.plan.findMany({ where: { gymId: user.gymId } }),

    // 👇 NEW: Count unique staff check-ins today
    db.staffAttendance.count({
        where: {
            staff: { gymId: user.gymId },
            checkIn: { gte: startOfToday }
        }
    })
  ])

  // --- 3. PROCESS DATA ---

  // Deduplication Logic
  const uniqueMembersSet = new Set();
  const todaysAttendance = rawAttendance.filter((log) => {
    if (uniqueMembersSet.has(log.memberId)) {
      return false; 
    }
    uniqueMembersSet.add(log.memberId);
    return true; 
  });

  // Filter Birthdays
  const todaysBirthdays = allActiveMembers.filter(m => {
    if (!m.dob) return false;
    const d = new Date(m.dob);
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth();
  });

  // Format Table Data
  const recentMembers = rawRecentMembers.map((member: any) => ({
    ...member,
    planId: member.plan?.id.toString() || "",
    planName: member.plan?.name || "No Plan",
    biometricId: member.biometricId || null,
    photoUrl: member.photoUrl || null,
    email: member.email || null,
  }))

  const stats = {
    totalMembers: totalCount,
    activeMembers: activeCount,
    newThisMonth: newCount,
    attendanceToday: todaysAttendance.length 
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6 w-full max-w-7xl mx-auto">
      
      <SectionCards stats={stats} />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        
        {/* LIVE FLOOR CARD (Members) */}
        <Card className="lg:col-span-4 flex flex-col h-[450px]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
               <Fingerprint className="text-blue-500 h-5 w-5" /> Live Floor
            </CardTitle>
            <CardDescription>
               Unique check-ins today ({todaysAttendance.length})
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden pt-0">
            <ScrollArea className="h-full pr-4">
              {todaysAttendance.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground gap-3">
                   <div className="p-4 bg-muted/50 rounded-full"><Fingerprint className="h-10 w-10 opacity-30" /></div>
                   <p>No check-ins yet today.</p>
                </div>
              ) : (
                <div className="space-y-3 mt-2">
                  {todaysAttendance.map((log) => {
                    const formatTime = (date: Date) => 
                      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    return (
                      <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg bg-card/50 hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border">
                            <AvatarImage src={log.member.photoUrl || ""} />
                            <AvatarFallback>{log.member.fullName.substring(0,2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-sm">{log.member.fullName}</p>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                               <span>In: {formatTime(log.checkIn)}</span>
                               {log.checkOut && (
                                 <>
                                   <span>→</span>
                                   <span className="text-orange-600 font-medium">Out: {formatTime(log.checkOut)}</span>
                                 </>
                               )}
                            </div>
                          </div>
                        </div>

                        {log.checkOut ? (
                           <Badge variant="outline" className="text-gray-500 border-gray-200 bg-gray-50">
                             Completed
                           </Badge>
                        ) : (
                           <Badge variant="secondary" className="text-green-600 bg-green-50 border-green-200 animate-pulse">
                             Present
                           </Badge>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-3 flex flex-col gap-6">
           
           {/* ACTION BUTTONS */}
           <div className="grid grid-cols-2 gap-3">
              <Button className="h-auto py-3 flex flex-col items-center justify-center gap-1 shadow-sm" variant="outline" asChild>
                <Link href="/dashboard/clients/add_client">
                   <UserPlus className="h-5 w-5 text-primary mb-1" />
                   <span className="text-xs font-medium">Add Member</span>
                </Link>
              </Button>
              <Button className="h-auto py-3 flex flex-col items-center justify-center gap-1 shadow-sm" variant="outline" asChild>
                 <Link href="/dashboard/settings">
                   <CreditCard className="h-5 w-5 text-primary mb-1" />
                   <span className="text-xs font-medium">New Plan</span>
                 </Link>
              </Button>
           </div>
           
           {/* 👇 NEW: STAFF ON DUTY CARD */}
           <Card className="bg-slate-900 text-white border-none shadow-md">
             <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-800 rounded-lg">
                        <Briefcase className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-300">Staff On Duty</p>
                        <p className="text-2xl font-bold">{staffPresentCount}</p>
                    </div>
                </div>
                <Button size="sm" variant="secondary" className="text-xs h-8" asChild>
                    <Link href="/dashboard/staff">View Team</Link>
                </Button>
             </CardContent>
           </Card>

           {/* TABS (Expiring / Birthdays) */}
           <Tabs defaultValue="expiring" className="w-full flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="expiring">Expiring ({expiringMembers.length})</TabsTrigger>
              <TabsTrigger value="birthdays">Birthdays ({todaysBirthdays.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="expiring" className="flex-1 mt-2">
              <Card className="h-full">
                <CardHeader className="pb-3 pt-4">
                  <CardTitle className="text-sm font-medium flex items-center text-orange-600">
                    <AlertTriangle className="mr-2 h-4 w-4" /> Renewal Needed
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {expiringMembers.length === 0 ? (
                    <div className="text-sm text-muted-foreground h-[150px] flex items-center justify-center">
                      No upcoming expirations.
                    </div>
                  ) : (
                    expiringMembers.map(m => (
                      <div key={m.id} className="flex items-center justify-between text-sm border-b last:border-0 pb-2 last:pb-0">
                         <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={m.photoUrl || ""} />
                                <AvatarFallback>{m.fullName[0]}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium truncate max-w-[120px]">{m.fullName}</span>
                         </div>
                         <div className="text-xs text-right">
                            <div className="text-muted-foreground">Expires</div>
                            <div className="font-bold text-orange-600">
                               {m.endDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
                            </div>
                         </div>
                      </div>
                    ))
                  )}
                  {expiringMembers.length > 0 && (
                      <Button variant="ghost" size="sm" className="w-full text-xs h-8 mt-2" asChild>
                          <Link href="/dashboard/clients?filter=expiring">View All</Link>
                      </Button>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="birthdays" className="flex-1 mt-2">
              <Card className="h-full">
                <CardHeader className="pb-3 pt-4">
                  <CardTitle className="text-sm font-medium flex items-center text-pink-500">
                    <Cake className="mr-2 h-4 w-4" /> Today's Party
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                   {todaysBirthdays.length === 0 ? (
                    <div className="text-sm text-muted-foreground h-[150px] flex items-center justify-center">
                      No birthdays today.
                    </div>
                  ) : (
                    todaysBirthdays.map(m => (
                       <div key={m.id} className="flex items-center justify-between text-sm border-b last:border-0 pb-2 last:pb-0">
                           <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={m.photoUrl || ""} />
                                    <AvatarFallback>{m.fullName[0]}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{m.fullName}</span>
                           </div>
                           <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" asChild>
                               <Link href={`https://wa.me/${m.whatsapp}?text=Happy Birthday ${m.fullName}! 🎉`} target="_blank">
                                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                               </Link>
                           </Button>
                       </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
           </Tabs>
        </div>

      </div>

      <div className="space-y-4">
          <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight">Recent Members</h2>
              <Button variant="ghost" asChild>
                  <Link href="/dashboard/clients">View All</Link>
              </Button>
          </div>
          <DataTable data={recentMembers} plans={plans} />
      </div>

    </div>
  )
}