"use server";

import { db } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

// --- 1. GENERAL SETTINGS ACTION ---
export async function updateGymProfile(formData: FormData) {
  const session = await auth()
  if (!session?.user?.email) return { error: "Unauthorized" }

  const gymName = formData.get("gymName") as string
  const phoneNumber = formData.get("phoneNumber") as string
  const address = formData.get("address") as string

  try {
    const user = await db.user.findUnique({ where: { email: session.user.email } })
    if (!user?.gymId) return { error: "No gym found" }

    await db.gym.update({
      where: { id: user.gymId },
      data: {
        name: gymName,
        phoneNumber: phoneNumber,
        address: address,
      }
    })

    revalidatePath("/dashboard/settings")
    return { success: "Gym profile updated" }
  } catch (err) {
    return { error: "Failed to update profile" }
  }
}

// --- 2. CREATE PLAN ACTION ---
// Add or Update this function
export async function createPlan(data: { name: string, price: number, duration: number }) {
    const session = await auth();
    if (!session?.user?.gymId) return { success: false };
  
    try {
      await db.plan.create({
        data: {
          name: data.name,
          price: data.price,
          duration: data.duration,
          gymId: Number(session.user.gymId)
        }
      });
      revalidatePath("/dashboard/settings");
      return { success: true };
    } catch (error) {
        console.error("Create Plan Error:", error);
      return { success: false };
    }
  }

// --- 3. DELETE PLAN ACTION ---
export async function deletePlan(planId: number) {
  const session = await auth()
  if (!session?.user?.email) return { error: "Unauthorized" }

  try {
    await db.plan.delete({ where: { id: planId } })
    revalidatePath("/dashboard/settings")
    return { success: "Plan deleted" }
  } catch (err) {
    return { error: "Failed to delete plan" }
  }
}

// --- 4. CREATE BIOMETRIC DEVICE (Fixed Version) ---
export async function createBiometricDevice(name: string, sn:string) {
  const session = await auth()
  if (!session?.user?.email) return { error: "Unauthorized" }

  
  // Generate a SHORT, readable ID (6 characters, Uppercase)
  // e.g. "K9X2M1"
  const shortId = Math.random().toString(36).substring(2, 8).toUpperCase();

  try {
    const user = await db.user.findUnique({ where: { email: session.user.email } })
    if (!user?.gymId) return { error: "No gym found" }

    await db.biometricDevice.create({
      data: {
        id: shortId, // 👈 Uses the generated Short Code
        name: name,
        gymId: user.gymId,
        isActive: true,
      }
    })

    // Revalidate BOTH possible paths to be safe
    revalidatePath("/dashboard/settings") 
    revalidatePath("/dashboard/settings/biometric")
    
    return { success: true }
    
  } catch (error) {
    console.error(error)
    return { error: "Failed to create device" }
  }
}

// --- 5. DELETE BIOMETRIC DEVICE ---
export async function deleteBiometricDevice(deviceId: string) {
  const session = await auth()
  if (!session?.user?.email) return { error: "Unauthorized" }

  try {
    await db.biometricDevice.delete({ where: { id: deviceId, gymId:Number(session.user.gymId)} })
    
    // Revalidate BOTH possible paths to be safe
    revalidatePath("/dashboard/settings")
    revalidatePath("/dashboard/settings/biometric")
    
    return { success: "Device deleted" }
  } catch (error) {
    return { error: "Failed to delete device" }
  }
}


export async function saveTwilioSettings(data: any) {
  const session = await auth();
  if (!session?.user?.email) return { success: false };

  const user = await db.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user?.gymId) return { success: false };

  await db.twilioSettings.upsert({
    where: { gymId: user.gymId },
    update: {
      // 1. Credentials
      accountSid: data.accountSid,
      authToken: data.authToken,
      phoneNumber: data.phoneNumber,
      
      // 2. Welcome
      enableWelcome: data.enableWelcome,
      welcomeTemplate: data.welcomeTemplate,

      // 3. Birthday
      enableBirthday: data.enableBirthday,
      birthdayTemplate: data.birthdayTemplate,

      // 4. Renewal
      enableRenewal: data.enableRenewal,
      renewalDaysBefore: data.renewalDaysBefore,
      renewalTemplate: data.renewalTemplate,
    },
    create: {
      gymId: user.gymId,
      accountSid: data.accountSid,
      authToken: data.authToken,
      phoneNumber: data.phoneNumber,
      enableWelcome: data.enableWelcome,
      welcomeTemplate: data.welcomeTemplate,
      enableBirthday: data.enableBirthday,
      birthdayTemplate: data.birthdayTemplate,
      enableRenewal: data.enableRenewal,
      renewalDaysBefore: data.renewalDaysBefore,
      renewalTemplate: data.renewalTemplate,
    },
  });

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function getTwilioSettings() {
  const session = await auth();
  if (!session?.user?.email) return null;

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    include: { gym: { include: { twilioSettings: true } } }
  });

  return user?.gym?.twilioSettings || null;
}