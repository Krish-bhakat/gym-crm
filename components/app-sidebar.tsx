"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconPackage,
  IconReport,
  IconSearch,
  IconSettings,
  IconShoppingBag,
  IconUsers,
} from "@tabler/icons-react"
import { usePathname } from "next/navigation"
import { Briefcase } from "lucide-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
const NavUser = dynamic(
  () => import("@/components/nav-user").then((mod) => mod.NavUser),
  { ssr: false } // This tells Next.js: "Don't render this on the server"
)
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"


// ... (Your existing 'data' object remains here for nav links) ...
const data = {
  // We can remove the hardcoded 'user' object here since we use props now
  navMain: [
    {
      title: "Overview",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Clients",
      url: "/dashboard/clients", // Matches your folder structure
      icon: IconUsers,
    },
    {
      title: "Staff",
      href: "/dashboard/staff",
      icon: Briefcase, 
    },
    {
      title: "Shop",
      url: "/dashboard/products", // Matches your folder structure
      icon: IconShoppingBag,
    },
    {
      title: "Inventory",
      url: "/dashboard/inventory",
      icon: IconPackage
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: IconSettings,
      isActive: true, // Optional: Makes it open by default
    }
  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: IconSettings,
    }
  ]
}

// 1. UPDATE: Adjusted the interface to match Prisma's output
interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    name?: string | null
    email?: string | null
    avatar?: string | null // Made optional
    gym?:{
      name: string
    } | null
    }
  }

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const gymName = user?.gym?.name || "";
  
  // 2. LOGIC: Create a safe user object for the UI (handling nulls)
  const safeUser = {
    name: user?.name || "User",
    email: user?.email || "No email",
    avatar: user?.avatar || "", // Fallback to empty string if null
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5"
            >
              <a href="/dashboard/clients/add_client">
                <IconInnerShadowTop className="size-5" />
                <span className="text-base font-semibold">{gymName}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        {/* 3. UPDATE: Use the 'safeUser' derived from props, not 'data.user' */}
        <NavUser user={safeUser} />
      </SidebarFooter>
    </Sidebar>
  )
}