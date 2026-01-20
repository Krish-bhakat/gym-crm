import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, ArrowLeft, TrendingUp, XCircle } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string; year?: string }>;
}

export default async function MemberAttendancePage({ params, searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.gymId) redirect("/login");

  // Await parameters (Next.js 15 requirement)
  const { id } = await params; 
  const { month, year } = await searchParams;

  const memberId = parseInt(id);
  if (isNaN(memberId)) return <div className="p-8">Invalid Member ID</div>;

  // 1. Get Current Date Filters
  const now = new Date();
  const selectedMonth = month ? parseInt(month) : now.getMonth();
  const selectedYear = year ? parseInt(year) : now.getFullYear();

  // 2. Fetch Member & Attendance Data
  const member = await db.member.findFirst({
    where: { 
      id: memberId, 
      gymId: Number(session.user.gymId) 
    },
    include: {
      attendance: {
        where: {
          checkIn: {
            gte: new Date(selectedYear, selectedMonth, 1),
            lt: new Date(selectedYear, selectedMonth + 1, 1),
          },
        },
        orderBy: { checkIn: "desc" },
      },
    },
  });

  if (!member) return <div className="p-8">Member not found</div>;

  // 3. Calculate Stats
  const totalDaysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const presentCount = member.attendance.length;
  const attendanceRate = totalDaysInMonth > 0 
    ? Math.round((presentCount / totalDaysInMonth) * 100) 
    : 0;

  // Navigation Links
  const prevMonthLink = `?month=${selectedMonth === 0 ? 11 : selectedMonth - 1}&year=${selectedMonth === 0 ? selectedYear - 1 : selectedYear}`;
  const nextMonthLink = `?month=${selectedMonth === 11 ? 0 : selectedMonth + 1}&year=${selectedMonth === 11 ? selectedYear + 1 : selectedYear}`;

  return (
    <div className="space-y-6 p-6">
      
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/clients">
            <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
            </Button>
        </Link>
        <div>
            <h2 className="text-2xl font-bold tracking-tight">{member.fullName}</h2>
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
                <CalendarDays className="h-4 w-4" /> 
                Attendance Record for {format(new Date(selectedYear, selectedMonth), "MMMM yyyy")}
            </p>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Days Present</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{presentCount}</div>
                <p className="text-xs text-muted-foreground">Check-ins this month</p>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Consistency</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{attendanceRate}%</div>
                <p className="text-xs text-muted-foreground">Attendance rate</p>
            </CardContent>
        </Card>

        {/* Month Selector */}
        <Card className="border-dashed">
             <CardContent className="pt-6 flex items-center justify-between gap-2">
                <Link href={prevMonthLink}><Button variant="outline" size="sm">Previous</Button></Link>
                <span className="font-semibold text-sm">
                    {format(new Date(selectedYear, selectedMonth), "MMM yyyy")}
                </span>
                <Link href={nextMonthLink}><Button variant="outline" size="sm">Next</Button></Link>
             </CardContent>
        </Card>
      </div>

      {/* DETAILED LIST */}
      <Card>
        <CardHeader>
            <CardTitle>Detailed Log</CardTitle>
        </CardHeader>
        <CardContent>
            {member.attendance.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground flex flex-col items-center gap-2">
                    <XCircle className="h-10 w-10 opacity-20" />
                    <p>No attendance records found for this month.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {member.attendance.map((log) => (
                        <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg transition">
                            <div className="flex items-center gap-4">
                                {/* Date Circle */}
                                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs">
                                    {format(log.checkIn, "dd")}
                                </div>
                                
                                {/* Info Text */}
                                <div>
                                    <p className="font-medium">{format(log.checkIn, "EEEE, MMMM do")}</p>
                                    
                                    {/* 👇 UPDATED: Time Display with Check-out */}
                                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                                        <span>In: <span className="font-semibold text-slate-700">{format(log.checkIn, "h:mm a")}</span></span>
                                        
                                        {/* @ts-ignore: Check if checkOut exists on type */}
                                        {log.checkOut ? (
                                            <>
                                                <span className="text-slate-300">•</span>
                                                {/* @ts-ignore */}
                                                <span>Out: <span className="font-semibold text-slate-700">{format(log.checkOut, "h:mm a")}</span></span>
                                            </>
                                        ) : (
                                            <span className="text-amber-600 italic ml-1 font-medium text-[10px] bg-amber-50 px-1 rounded border border-amber-200">
                                                Active
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Status Badge */}
                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                Present
                            </Badge>
                        </div>
                    ))}
                </div>
            )}
        </CardContent>
      </Card>

    </div>
  );
}