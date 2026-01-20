import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Helper to parse the weird text format from ESSL
function parseEsslData(textData: string) {
  const lines = textData.split("\n").filter(line => line.trim().length > 0);
  return lines.map(line => {
    const parts = line.split("\t"); 
    return {
      userId: parts[0],
      timestamp: parts[1],
      state: parts[2] 
    };
  });
}

// THE SHARED GET HANDLER (Handshake)
export async function handleBiometricHandshake(req: Request) {
  const { searchParams } = new URL(req.url);
  const sn = searchParams.get('SN'); 

  if (sn) {
    // Standard ESSL/ZKTeco Handshake
    return new NextResponse("GET OPTION FROM: " + sn + "\nATTLOGStamp=None\nOpStamp=None\nPhotoStamp=None\nErrorDelay=30\nDelay=10\nTransTimes=00:00;14:05\nTransInterval=1\nTransFlag=1111000000\nRealtime=1\nEncrypt=0", {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
  return NextResponse.json({ message: "Biometric Server Online" });
}

// THE SHARED POST HANDLER (Data Receiver)
export async function handleBiometricData(req: Request) {
  try {
    const url = new URL(req.url);
    const sn = url.searchParams.get('SN'); 
    const table = url.searchParams.get('table');

    let attendanceEvents: any[] = [];
    let deviceKey = "";

    // 1. Check if it's ESSL Text Data
    if (sn && table === 'ATTLOG') {
      deviceKey = sn; 
      const textBody = await req.text(); 
      attendanceEvents = parseEsslData(textBody);
    } 
    // 2. Check if it's JSON Data (For custom scripts or other brands)
    else {
      const jsonBody = await req.json().catch(() => ({}));
      if (jsonBody.deviceKey) {
        deviceKey = jsonBody.deviceKey;
        attendanceEvents = [{ 
            userId: jsonBody.userId, 
            timestamp: jsonBody.timestamp || new Date() 
        }];
      }
    }

    if (!deviceKey || attendanceEvents.length === 0) {
      return new NextResponse("Error: No Data", { status: 400 });
    }

    // 3. Database Logic: Validate Device
    const device = await db.biometricDevice.findUnique({
      where: { id: deviceKey },
      include: { gym: true }
    });

    if (!device || !device.isActive) {
      return new NextResponse("Unauthorized Device", { status: 401 }); 
    }

    let successCount = 0;
    
    // 4. Process Logs (Members OR Staff)
    for (const event of attendanceEvents) {
      const scanTime = new Date(event.timestamp);

      // --- CHECK A: IS IT A MEMBER? ---
      const member = await db.member.findFirst({
        where: { 
          gymId: device.gymId,
          biometricId: event.userId 
        }
      });

      if (member) {
        // Prevent duplicate check-ins (5 mins)
        const fiveMinutesAgo = new Date(scanTime.getTime() - 5 * 60000);
        
        const existing = await db.attendance.findFirst({
          where: {
            memberId: member.id,
            checkIn: { gte: fiveMinutesAgo }
          }
        });

        if (!existing) {
            await db.attendance.create({
                data: {
                    memberId: member.id,
                    checkIn: scanTime,
                    status: 'PRESENT'
                }
            });
            successCount++;
        }
        continue; // Found a match, move to next event
      }

      // --- CHECK B: IS IT STAFF? ---
      // If code reached here, it wasn't a member. Let's check Staff table.
      const staff = await db.staff.findFirst({
        where: {
            gymId: device.gymId,
            biometricId: event.userId
        }
      });

      if (staff) {
        // Prevent duplicate check-ins (10 mins for staff)
        const tenMinutesAgo = new Date(scanTime.getTime() - 10 * 60000);

        const existingStaffLog = await db.staffAttendance.findFirst({
            where: {
                staffId: staff.id,
                checkIn: { gte: tenMinutesAgo }
            }
        });

        if (!existingStaffLog) {
             await db.staffAttendance.create({
                data: {
                    staffId: staff.id,
                    checkIn: scanTime,
                    // If you added a 'status' column to StaffAttendance, uncomment this:
                    // status: 'PRESENT' 
                }
            });
            successCount++;
        }
      }
    }

    console.log(`✅ Processed ${successCount} logs from ${device.name}`);

    // Return "OK" for ESSL
    return new NextResponse("OK", { 
        status: 200, 
        headers: { 'Content-Type': 'text/plain' } 
    });

  } catch (error) {
    console.error("Biometric Error:", error);
    return new NextResponse("Error", { status: 500 });
  }
}