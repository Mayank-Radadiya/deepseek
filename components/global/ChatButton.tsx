import Image from "next/image";
import { assets } from "@/public/assets";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import axios from "axios";

interface ChatButtonProps {
  open: boolean;
}

const ChatButton = ({ open }: ChatButtonProps) => {
  // Function to handle chat button click
  const handleChatButtonClick = async () => {
    // Logic to handle chat button click
    const chat = await axios.post("/api/chat/create");
    try {
      console.log("Chat created:", chat.data);
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  };
  
  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleChatButtonClick}
              className={` flex items-center justify-center cursor-pointer ${
                open
                  ? "bg-primary hover:opacity-80 rounded-2xl gap-2 p-2.5 w-max"
                  : "group relative h-9 w-9 mx-auto hover:bg-gray-500/20 rounded-lg mt-8"
              }`}
            >
              <Image
                className={`${open ? "w-6 " : "w-7"}`}
                src={open ? assets.chat_icon : assets.chat_icon_dull}
                height={open ? 20 : 35}
                width={open ? 20 : 35}
                alt="Chat icon"
              />
              {open && (
                <p>
                  <span className="text-sm font-medium text-white">
                    New Chat
                  </span>
                </p>
              )}
            </button>
          </TooltipTrigger>
          {!open && (
            <TooltipContent sideOffset={5}>
              <span className="text-sm font-medium text-white">Open Chat</span>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </>
  );
};

export default ChatButton;
