"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { assets } from "@/public/assets";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { UserButton, useUser } from "@clerk/nextjs";
import ChatButton from "./ChatButton";

export function AppSidebar() {
  const { open } = useSidebar();
  const { user } = useUser(); // Get the current user client-side

  return (
    <Sidebar
      collapsible="icon"
      className="border-none flex flex-col items-center justify-between"
    >
      {/* //* Sidebar header */}
      <SidebarHeader className="w-full h-28">
        {!open ? (
          <div className="flex flex-col items-center justify-center w-full pt-6">
            <Image src={assets.logo_icon} height={100} width={100} alt="Logo" />
            <SidebarTrigger className="hover:bg-transparent cursor-pointer mt-8" />
          </div>
        ) : (
          <div className="flex items-center justify-between w-full h-full px-4">
            <Image src={assets.logo_text} height={150} width={150} alt="Logo" />
            <SidebarTrigger className="hover:bg-transparent cursor-pointer" />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="mt-8 h-full w-full flex flex-col items-center overflow-hidden">
        <SidebarGroup>
          <SidebarGroupContent>
            <ChatButton open={open} />
          </SidebarGroupContent>
        </SidebarGroup>

        {open && (
          <SidebarGroup>
            <SidebarGroupContent>
              <p className="text-sm font-medium text-zinc-600 hover:text-zinc-500">
                Chat History
              </p>
              <div className="h-[500px] w-full overflow-scroll flex flex-col gap-2 px-3">
                {/* //! history of user chat.... */}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Sidebar footer */}
      <SidebarFooter>
        <div className="flex items-center justify-center w-full h-24 gap-4 flex-col py-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "flex items-center justify-center w-full px-4 py-2 rounded-2xl   transition-all duration-300 gap-1.5",
                    open ? "border border-gray-400 hover:border-blue-400" : ""
                  )}
                >
                  <Image
                    src={open ? assets.phone_icon : assets.phone_icon_dull}
                    height={25}
                    width={25}
                    alt="Phone"
                    className="transform hover:scale-110 transition-transform duration-300"
                  />

                  <p
                    className={cn(
                      "ml-1 text-sm font-medium text-white transition-opacity duration-200 ",
                      open ? "opacity-100" : "opacity-0 w-0 h-0 overflow-hidden"
                    )}
                  >
                    Get App
                  </p>
                  <Image
                    className={`${open ? "" : "hidden"}`}
                    src={assets.new_icon}
                    alt="New Icon"
                    height={28}
                    width={28}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-transparent border-none shadow-none animate-fade-in">
                <div className="p-4 bg-[#121212] rounded-lg shadow-xl">
                  <Image
                    src={assets.qrcode}
                    height={160}
                    width={160}
                    alt="QR Code"
                    className={cn(
                      "object-contain rounded-md ",
                      open
                        ? "border border-blue-300 transform hover:scale-105 transition-transform duration-300"
                        : "opacity-90"
                    )}
                  />
                  <p className="text-xs text-center mt-2 text-white font-medium">
                    My Portfolio
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="transform hover:scale-110 transition-transform duration-300 flex gap-x-5 items-center">
            <UserButton />
            {open && <p className="text-sm font-semibold">My Profile</p>}
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
