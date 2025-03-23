"use client";
import { cn } from "@/lib/utils";
import { assets } from "@/public/assets";
import Image from "next/image";
import { useState } from "react";


const PromptBox = () => {
  const [prompt, setPrompt] = useState<string>("");
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
              className="cursor-pointer"
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
              <Image
                src={assets.arrow_icon}
                alt="upload_icon"
                height={15}
                width={15}
              />
            </button>
          </div>
        </div>
      </form>
    </>
  );
};

export default PromptBox;
