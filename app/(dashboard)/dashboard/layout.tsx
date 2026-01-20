import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 1. Fetch the user session
  const session = await auth()

  // 2. Security check
  if (!session?.user) {
    return redirect("/login")
  }

  // 3. Create the user object to pass to the sidebar
  // We use "||" to provide fallbacks if data is missing
  const userData = {
    name: session.user.name || "Gym Owner",
    email: session.user.email || "No Email",
    avatar: session.user.image || "",
  }

  return (
    // ✅ Use SidebarProvider to handle state/mobile logic automatically
    <SidebarProvider>
      
      {/* 👇 PASS THE USER DATA HERE */}
      <AppSidebar user={userData} />
      
      {/* This wraps your main page content */}
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            {/* You can add a Breadcrumb here if you want */}
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}