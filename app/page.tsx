"use client";
import { AppSidebar } from "@/components/global/AppSidebar";
import Message from "@/components/global/Message";
import PromptBox from "@/components/global/PromptBox";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAppContext } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { assets } from "@/public/assets";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

// Define the Message type based on your schema
interface ChatMessage {
  role: string;
  content: string;
  timeStamp?: number;
}

export default function Home() {
  const [message, setMessage] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const { selectedChat, fetchUserChats } = useAppContext();
  const containerRef = useRef<HTMLDivElement>(null);

  // Update messages when selectedChat changes
  useEffect(() => {
    if (selectedChat) {
      setMessage(selectedChat.messages || []);
    } else {
      setMessage([]);
    }
  }, [selectedChat]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop =
        containerRef.current.scrollHeight - containerRef.current.clientHeight;
    }
  }, [message]);

  return (
    <div className="flex max-h-screen p-4">
      {/* Sidebar */}
      <div className="w-64 h-screen text-white">
        <SidebarProvider>
          <AppSidebar />
        </SidebarProvider>
      </div>

      {/* Main Content */}
      <main className="flex flex-col w-full flex-1 h-screen items-center relative overflow-scroll">
        {message.length === 0 ? (
          <>
            <div className="flex flex-col items-center h-full justify-center mb-1 pb-28">
              <div className="flex items-center justify-center mb-4 gap-x-3">
                <Image
                  src={assets.logo_icon}
                  height={60}
                  width={60}
                  alt="logo"
                />
                <h1 className="text-3xl text-white">Hi, I&apos;m Deepseek.</h1>
              </div>
            </div>
          </>
        ) : (
          <>
            <div
              className="w-full flex-1 overflow-y-auto p-4 items-center flex flex-col"
              ref={containerRef}
            >
              <p className="fixed top-4 right-4 border-transparent hover:border-gray-500/50 px-2 rounded-lg font-semibold text-white">
                {selectedChat?.name}
              </p>
              {message.map((msg, index) => (
                <Message
                  key={index}
                  role={msg.role}
                  content={msg.content}
                  loading={loading}
                />
              ))}
            </div>
          </>
        )}

        {/* InputPrompt box */}
        <div
          className={cn(
            "w-full max-w-3xl p-2 ml-32 transform transition-all duration-300 ease-in-out mb-3",
            message.length === 0 ? " absolute top-[50%]" : ""
          )}
        >
          <PromptBox loading={loading} setLoading={setLoading} />
        </div>

        <button onClick={fetchUserChats}>click</button>
      </main>
    </div>
  );
}
