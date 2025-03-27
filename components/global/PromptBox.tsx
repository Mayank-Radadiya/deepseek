"use client";

import { useAppContext } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { assets } from "@/public/assets";
import axios from "axios";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";


interface PromptBoxProps {
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const PromptBox = ({ loading, setLoading }: PromptBoxProps) => {
  const [prompt, setPrompt] = useState<string>("");

  const { user, chat, setChat, selectedChat, setSelectedChat } =
    useAppContext();

    console.log("chat", chat);
    

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sentPrompt(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  const sentPrompt = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user) {
        toast.error("Please login to continue");
        return;
      }

      if (!selectedChat) {
        toast.error("No chat selected");
        return;
      }

      const userPrompt = {
        role: "user",
        content: prompt.trim(), // Trim whitespace
        timeStamp: Date.now(),
      };

      // Ensure prompt isn't empty
      if (!userPrompt.content) {
        toast.error("Please enter a message");
        return;
      }

      // Update selectedChat with the user message
      const updatedMessages = Array.isArray(selectedChat.messages)
        ? [...selectedChat.messages, userPrompt]
        : [userPrompt];
      setSelectedChat({
        ...selectedChat,
        messages: updatedMessages,
      });

      // Update the chat array to keep it in sync
      setChat((prev) =>
        prev.map((chatItem) =>
          chatItem._id === selectedChat._id
            ? { ...chatItem, messages: updatedMessages }
            : chatItem
        )
      );

      setPrompt(""); // Clear prompt after successful state update

      const { data } = await axios.post("/api/chat/ai", {
        chatId: selectedChat._id,
        prompt: userPrompt.content,
      });

      // Check if response is successful and has expected data
      if (data?.status === 200 && data.data?.content) {
        const assistantPrompt = {
          role: "assistant",
          content: data.data.content,
          timeStamp: Date.now(),
        };

        // Update selectedChat with the assistant response
        const newMessages = [...updatedMessages, assistantPrompt];
        setSelectedChat({
          ...selectedChat,
          messages: newMessages,
        });

        // Update the chat array to keep it in sync
        setChat((prev) =>
          prev.map((chatItem) =>
            chatItem._id === selectedChat._id
              ? { ...chatItem, messages: newMessages }
              : chatItem
          )
        );
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Error in sentPrompt:", error);
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className="w-full max-w-2xl bg-[#404045] p-4 rounded-3xl shadow-md mt-4 transition-all duration-300"
      onSubmit={sentPrompt}
    >
      <textarea
        onKeyDown={handleKeyDown}
        name="prompt"
        rows={2}
        className="w-full bg-transparent border-none outline-none text-white placeholder:text-slate-400 resize-none overflow-hidden break-words"
        placeholder="Type your message here..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        required
      />
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-xm text-slate-400 border border-gray-300/40 hover:bg-gray-500/20 rounded-full px-2 py-1 cursor-pointer">
            <Image
              src={assets.deepthink_icon}
              alt="icon"
              width={15}
              height={15}
            />{" "}
            DeepThink R1
          </p>
          <p className="flex items-center gap-2 text-xm text-slate-400 border border-gray-300/40 hover:bg-gray-500/20 rounded-full px-2 py-1 cursor-pointer">
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
            disabled={loading}
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
  );
};

export default PromptBox;
