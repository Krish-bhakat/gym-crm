import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

// Force dynamic prevents static caching issues
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();

    // LOGGING: Check if session exists in the terminal
    console.log("Export API Session:", session?.user?.email);

    if (!session?.user?.gymId) {
      console.log("❌ Export failed: No Gym ID in session");
      return new NextResponse("Unauthorized: No Gym ID found", { status: 401 });
    }

    const gymId = Number(session.user.gymId);

    // 1. Fetch Data
    const members = await db.member.findMany({
      where: { 
        gymId: gymId 
      },
      select: {
        fullName: true,
        whatsapp: true,
        email: true,
        gender: true,
        planName: true,
        status: true,
        startDate: true,
        endDate: true,
        // Ensure these fields actually exist in your schema:
        // amountPaid: true, 
        // balance: true,
      }
    });

    console.log(`✅ Found ${members.length} members for export.`);

    // 2. Define CSV Headers
    const headers = [
      "Full Name",
      "WhatsApp",
      "Email",
      "Gender",
      "Plan",
      "Status",
      "Start Date",
      "End Date",
      "biometricId"
    ];

    // 3. Convert Data to CSV String
    const csvRows = [
      headers.join(","), // Header Row
      ...members.map(row => {
        const formatDate = (d: Date | null) => d ? d.toISOString().split('T')[0] : "";
        const cleanStr = (s: string | null) => s ? `"${s.replace(/"/g, '""')}"` : ""; 

        return [
          cleanStr(row.fullName),
          cleanStr(row.whatsapp),
          cleanStr(row.email),
          row.gender,
          cleanStr(row.planName),
          row.status,
          formatDate(row.startDate),
          formatDate(row.endDate),
        ].join(",");
      })
    ];

    const csvString = csvRows.join("\n");

    // 4. Return as File Download
    return new NextResponse(csvString, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="clients_export_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (error) {
    console.error("❌ CSV EXPORT ERROR:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}