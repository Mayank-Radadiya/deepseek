"use client";
import { useAppContext } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { assets } from "@/public/assets";
import axios from "axios";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

interface Chat {
  _id: string;
  messages: {
    // Changed from 'message' to 'messages' to match your setChat usage
    role: string;
    content: string;
    timeStamp: number;
  }[];
  userId: string;
  name: string;
}

const PromptBox = () => {
  const [prompt, setPrompt] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const { user, chat, setChat, selectedChat, setSelectedChat } =
    useAppContext();

  const sentPrompt = async (e: React.FormEvent<HTMLFormElement>) => {
    setLoading(true);
    try {
      e.preventDefault();
      if (!user) return toast.error("Please login to continue");

      setPrompt("");

      const userPrompt = {
        role: "user",
        content: prompt,
        timeStamp: Date.now(),
      };

      setChat((prev) =>
        prev.map((chat: Chat) =>
          chat._id === selectedChat?._id
            ? { ...chat, messages: [...chat.messages, userPrompt] }
            : chat
        )
      );

      setSelectedChat((prev) => ({
        ...prev,
        messages: [...prev?.messages, userPrompt],
      }));

      const data = await axios.post("/api/chat/ai", {
        chatId: selectedChat._id,
        prompt,
      });

      if (data.status === 200) {
        setChat((prev) =>
          prev.map((chat: Chat) =>
            chat._id === selectedChat?._id
              ? { ...chat, messages: [...chat.messages, data.data] }
              : chat
          )
        );

        const message = data.data.content;

        const messageToken = message.split(" ");
        let 
      } else {
        toast.error("Something went wrong");
        setPrompt("");
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <form className="w-full max-w-2xl bg-[#404045] p-4 rounded-3xl shadow-md mt-4 transition-all duration-300">
        <textarea
          rows={2}
          className="w-full bg-transparent border-none outline-none text-white placeholder:text-slate-400 resize-none overflow-hidden break-words"
          placeholder="Type your message here..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          required
        />
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-xm text-slate-400 border border-gray-300/40 hover:bg-gray-500/20  rounded-full px-2 py-1 cursor-pointer">
              <Image
                src={assets.deepthink_icon}
                alt="icon"
                width={15}
                height={15}
              />{" "}
              DeepThink R1
            </p>
            <p className="flex items-center gap-2 text-xm text-slate-400 border border-gray-300/40 hover:bg-gray-500/20  rounded-full px-2 py-1 cursor-pointer">
              <Image
                src={assets.search_icon}
                alt="icon"
                width={15}
                height={15}
                className="h-auto w-auto"
              />{" "}
              Search
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Image
              src={assets.pin_icon}
              alt="pin_icon"
              height={15}
              width={15}
              className="cursor-pointer h-auto w-auto"
            />
            <button
              type="submit"
              className={cn(
                "text-white text-sm font-semibold rounded-full px-2 py-2",
                prompt.length > 0
                  ? "bg-primary hover:opacity-75 cursor-pointer"
                  : "bg-gray-500/30 cursor-not-allowed"
              )}
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Image
                  src={assets.arrow_icon}
                  alt="upload_icon"
                  height={15}
                  width={15}
                  className="h-auto w-auto"
                />
              )}
            </button>
          </div>
        </div>
      </form>
    </>
  );
};

export default PromptBox;
