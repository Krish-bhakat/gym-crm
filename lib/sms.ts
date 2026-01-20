import { db } from "@/lib/db";
import twilio from "twilio";

export async function sendSms(gymId: number, to: string, body: string) {
  try {
    // 1. Fetch credentials for this specific gym
    const settings = await db.twilioSettings.findUnique({
      where: { gymId }
    });

    if (!settings?.accountSid || !settings?.authToken || !settings?.phoneNumber) {
      console.log("⚠️ Twilio not configured for Gym ID:", gymId);
      return { success: false, error: "Twilio not configured" };
    }

    // 2. Initialize Twilio Client
    const client = twilio(settings.accountSid, settings.authToken);

    // 3. Send Message
    const message = await client.messages.create({
      body: body,
      from: settings.phoneNumber,
      to: to,
    });

    console.log("✅ SMS Sent:", message.sid);
    return { success: true, sid: message.sid };

  } catch (error) {
    console.error("❌ SMS Failed:", error);
    return { success: false, error: error };
  }
}