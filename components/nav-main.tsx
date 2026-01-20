"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"
import { usePathname } from "next/navigation" // 👈 1. Hook to check current URL
import Link from "next/link" // 👈 2. Next.js Link for instant navigation

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    href?: string
    url?:string
    icon?: any
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const pathname = usePathname() // Get current path (e.g., "/dashboard/clients")

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          // Check if this main item is currently active
          const isMainActive = pathname === item.href 
          // Check if any child item is active (to keep menu open)
          const isChildActive = item.items?.some(sub => pathname === sub.url)
          
          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive || isChildActive} // Auto-open if child is active
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton 
                    asChild 
                    tooltip={item.title}
                    isActive={isMainActive} // Highlights the button if active
                  >
                    {/* 3. Logic: If it has sub-items, make it a button, else make it a Link */}
                    {item.items?.length ? (
                       <div className="cursor-pointer">
                          {item.icon && <item.icon />}
                          <span>{item.title}</span>
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                       </div>
                    ) : (
                       <Link href={item.href || item.url ||"#"}>
                          {item.icon && <item.icon />}
                          <span>{item.title}</span>
                       </Link>
                    )}
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                
                {/* 4. Sub-Menu Items */}
                {item.items?.length ? (
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map((subItem) => {
                        const isSubActive = pathname === subItem.url
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild isActive={isSubActive}>
                              <Link href={subItem.url}>
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                ) : null}
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}