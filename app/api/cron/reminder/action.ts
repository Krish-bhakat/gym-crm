import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendSms } from "@/lib/sms";

// Prevent caching so it runs fresh every time
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const today = new Date();
  let logs = [];

  // ------------------------------------------
  // 1. HAPPY BIRTHDAY LOGIC
  // ------------------------------------------
  const birthdayGyms = await db.twilioSettings.findMany({
    where: { enableBirthday: true }
  });

  for (const settings of birthdayGyms) {
    // Find active members in this gym with birthday matching today (Month & Day)
    // Note: Prisma doesn't support easy "day/month" extraction in 'findMany', so we filter in JS or use raw query.
    // For simplicity/safety in this demo, we use raw query:
    
    const members = await db.$queryRaw`
      SELECT id, "fullName", "whatsapp" FROM "Member"
      WHERE "gymId" = ${settings.gymId}
      AND "status" = 'ACTIVE'
      AND EXTRACT(MONTH FROM "dob") = ${today.getMonth() + 1}
      AND EXTRACT(DAY FROM "dob") = ${today.getDate()}
    ` as any[];

    for (const m of members) {
       if (!m.whatsapp) continue;
       const msg = settings.birthdayTemplate.replace("{member_name}", m.fullName);
       await sendSms(settings.gymId, m.whatsapp, msg);
       logs.push(`🎂 Birthday SMS -> ${m.fullName}`);
    }
  }

  // ------------------------------------------
  // 2. RENEWAL REMINDER LOGIC
  // ------------------------------------------
  const renewalGyms = await db.twilioSettings.findMany({
    where: { enableRenewal: true }
  });

  for (const settings of renewalGyms) {
    // Calculate the target expiry date
    const targetDate = new Date();
    targetDate.setDate(today.getDate() + settings.renewalDaysBefore);
    
    // Set time range for that specific day
    const startOfDay = new Date(targetDate.setHours(0,0,0,0));
    const endOfDay = new Date(targetDate.setHours(23,59,59,999));

    const members = await db.member.findMany({
      where: {
        gymId: settings.gymId,
        status: "ACTIVE",
        endDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    for (const m of members) {
       if (!m.whatsapp) continue;
       const msg = settings.renewalTemplate.replace("{member_name}", m.fullName);
       await sendSms(settings.gymId, m.whatsapp, msg);
       logs.push(`⚠️ Renewal SMS -> ${m.fullName}`);
    }
  }

  return NextResponse.json({ success: true, logs });
}