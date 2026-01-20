import { redirect } from "next/navigation";
import { auth } from "@/auth"; // Make sure this path points to your auth helper

export default async function Home() {
  const session = await auth();

  // If logged in, go to dashboard
  if (session?.user) {
    redirect("/dashboard");
  }

  // If not logged in, go to login page
  redirect("/auth/login"); // Or wherever your login page is
}