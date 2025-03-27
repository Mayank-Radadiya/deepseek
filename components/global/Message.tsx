"use client";
import { cn } from "@/lib/utils";
import { assets } from "@/public/assets";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Markdown from "react-markdown";
import Prism from "prismjs";
import { useEffect } from "react";
import { toast } from "sonner";

interface MessageProps {
  role: string;
  content: string;
  loading?: boolean;
}

const Message = ({ role, content, loading }: MessageProps) => {
  useEffect(() => {
    Prism.highlightAll();
  }, [content]); // Highlight code blocks

  const copyText = () => {
    navigator.clipboard.writeText(content);
    toast.success("Text copied to clipboard!");
  };
  return (
    <TooltipProvider>
      <div className="flex flex-col items-center w-full max-w-3xl text-sm p-3">
        <div
          className={cn(
            "flex flex-col w-full mb-8",
            role === "user" ? "items-end" : "items-start"
          )}
        >
          <div
            className={cn(
              "group relative flex max-w-2xl py-3 px-4 rounded-[10px]",
              role === "user"
                ? "bg-[#414158] text-white"
                : "bg-gray-800 text-white/90 gap-3 bg-opacity-80"
            )}
          >
            <div
              className={cn(
                "opacity-0 group-hover:opacity-100 absolute transition-all",
                role === "user" ? "-left-16 top-2.5" : "left-9 -bottom-6"
              )}
            >
              <div className="flex items-center gap-2 opacity-70">
                {role === "user" ? (
                  <>
                    <Tooltip>
                      <TooltipTrigger>
                        <Image
                          src={assets.copy_icon}
                          alt="copy"
                          width={20}
                          height={20}
                          className="w-4 cursor-pointer"
                        />
                      </TooltipTrigger>
                      <TooltipContent>Copy</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger>
                        <Image
                          src={assets.pencil_icon}
                          alt="edit"
                          width={20}
                          height={20}
                          className="w-4.5 cursor-pointer"
                        />
                      </TooltipTrigger>
                      <TooltipContent>Edit</TooltipContent>
                    </Tooltip>
                  </>
                ) : (
                  <>
                    <Tooltip>
                      <TooltipTrigger>
                        <Image
                          src={assets.copy_icon}
                          alt="copy"
                          width={20}
                          height={20}
                          onClick={copyText}
                          className="w-4 cursor-pointer"
                        />
                      </TooltipTrigger>
                      <TooltipContent>Copy</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger>
                        <Image
                          src={assets.regenerate_icon}
                          alt="regenerate"
                          className="w-4 cursor-pointer"
                          width={20}
                          height={20}
                        />
                      </TooltipTrigger>
                      <TooltipContent>Regenerate</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger>
                        <Image
                          src={assets.like_icon}
                          alt="like"
                          width={20}
                          height={20}
                          className="w-4 cursor-pointer"
                        />
                      </TooltipTrigger>
                      <TooltipContent>Like</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger>
                        <Image
                          src={assets.dislike_icon}
                          alt="dislike"
                          width={20}
                          height={20}
                          className="w-4 cursor-pointer"
                        />
                      </TooltipTrigger>
                      <TooltipContent>Dislike</TooltipContent>
                    </Tooltip>
                  </>
                )}
              </div>
            </div>

            {role === "user" ? (
              <span className="text-white/90 break-words">{content}</span>
            ) : (
              <div className="flex items-start gap-3 w-full">
                <Image
                  src={assets.logo_icon}
                  alt="logo"
                  width={36}
                  height={36}
                  className="w-9 h-9 p-1 border border-white/15 rounded-full"
                />
                <div className="space-y-4 w-full overflow-auto break-words">
                  {loading && (
                    <>
                      <div className="flex flex-row gap-2">
                        <div className="w-4 h-4 rounded-full bg-blue-700 animate-bounce [animation-delay:.7s]"></div>
                        <div className="w-4 h-4 rounded-full bg-blue-700 animate-bounce [animation-delay:.3s]"></div>
                        <div className="w-4 h-4 rounded-full bg-blue-700 animate-bounce [animation-delay:.7s]"></div>
                      </div>
                    </>
                  )}
                  {<Markdown>{content}</Markdown>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Message;
