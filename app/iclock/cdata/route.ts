import { handleBiometricHandshake, handleBiometricData } from "@/lib/biometric-handler";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  return handleBiometricHandshake(req);
}

export async function POST(req: Request) {
  return handleBiometricData(req);
}