"use client";
import { AppSidebar } from "@/components/global/AppSidebar";
import Message from "@/components/global/Message";
import PromptBox from "@/components/global/PromptBox";
import { SidebarProvider } from "@/components/ui/sidebar";
import { assets } from "@/public/assets";
import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const [message, setMessage] = useState<string>("");
  console.log(setMessage);

  return (
    <>
      <div className="flex max-h-screen p-4">
        {/* Sidebar */}
        <div>
          <SidebarProvider>
            <AppSidebar />
          </SidebarProvider>
        </div>

        {/* Main Content */}
        <main className="flex flex-col w-full max-h-screen items-center justify-center">
          {message.length === 0 ? (
            <>
              <div className="flex  items-center justify-center mb-1">
                <Image
                  src={assets.logo_icon}
                  height={60}
                  width={60}
                  alt="logo"
                />
                <h1 className="text-3xl">Hi,  I&apos;m Deepseek.</h1>
              </div>
              <p className="text-sm font-semibold text-slate-400">
                How can i help you today?
              </p>
            </>
          ) : (
            <>
              <Message role="user" content="hello " />
            </>
          )}

          {/* InputPrompt box */}
          <PromptBox />
        </main>
      </div>
    </>
  );
}
