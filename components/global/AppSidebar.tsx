"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { assets } from "@/public/assets";
import Image from "next/image";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function AppSidebar() {
  const { open } = useSidebar();

  return (
    <Sidebar
      collapsible="icon"
      className="border-none flex flex-col items-center"
    >
      {/* sidebar header when sidebar is close */}
      <SidebarHeader className="w-full h-20">
        {!open && (
          <>
            <div className="flex flex-col items-center justify-center w-full h-28 gap-y-5 pt-5">
              <Image
                src={assets.logo_icon}
                height={100}
                width={100}
                alt="Logo"
              />
              <SidebarTrigger className="hover:bg-transparent cursor-pointer" />
            </div>
          </>
        )}

        {/* sidebar header */}

        {open && (
          <div className="flex items-center justify-between w-full h-full px-4">
            <Image src={assets.logo_text} height={150} width={150} alt="Logo" />

            <SidebarTrigger className="hover:bg-transparent cursor-pointer" />
          </div>
        )}
      </SidebarHeader>

      {open && (
        <>
          {/* 
      
      */}
        </>
      )}
      <SidebarFooter />
    </Sidebar>
  );
}
