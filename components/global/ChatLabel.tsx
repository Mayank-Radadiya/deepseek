"use client";
import { useRef, useState } from "react";
import { Button } from "../ui/button";
import { assets } from "@/public/assets";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import axios from "axios";
import { toast } from "sonner";

interface chatLabelProps {
  chatTitle: string;
  id: string;
}

const ChatLabel = ({ chatTitle, id }: chatLabelProps) => {
  const [open, setOpen] = useState(false);
  const [actionType, setActionType] = useState<"edit" | "delete" | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const deleteChat = async () => {
    try {
      await axios.delete("/api/chat/delete", {
        data: {
          id,
        },
      });
      toast.success("Chat deleted successfully");
    } catch (error) {
      toast.error("Failed to delete chat");
    }
  };

  const renameChat = async () => {
    try {
      await axios.post("/api/chat/rename", {
        id,
        newName: inputRef.current?.value || "",
      });
      toast.success("Chat edited successfully");
    } catch (error) {
      toast.error("Failed to rename chat");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DropdownMenu>
          <Button
            variant="ghost"
            className="flex items-center justify-start w-full text-white/80 hover:bg-white/10 hover:text-white/100 rounded-[5px] text-sm font-medium py-2 px-4 transition-all duration-300 gap-2 group"
          >
            <div className="flex items-center justify-between w-full">
              <span> {chatTitle} </span>
              <DropdownMenuTrigger className="border-none outline-none">
                <Image
                  src={assets.three_dots}
                  alt="dot"
                  width={20}
                  height={20}
                  className="cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
              </DropdownMenuTrigger>
            </div>
          </Button>

          <DropdownMenuContent
            className="ml-5 mt-15 bg-sidebar/60 rounded-[5px] shadow-lg border-[0.7px]"
            side="right"
          >
            <DropdownMenuItem
              className="flex items-center gap-2 hover:opacity-80"
              onClick={() => {
                setActionType("edit");
                setOpen(true);
              }}
            >
              <Image
                src={assets.chat_icon}
                alt="edit"
                className="rounded-full"
                width={30}
                height={30}
              />
              <span>Edit</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="h-[0.5px] opacity-50" />

            <DropdownMenuItem
              className="flex items-center gap-2 hover:opacity-80"
              onClick={() => {
                setActionType("delete");
                setOpen(true);
              }}
            >
              <Image
                src={assets.delete_icon}
                alt="delete"
                className="rounded-full"
                width={30}
                height={30}
              />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Dialog Content */}
        <DialogContent className="text-sm text-white/80 rounded-[5px] shadow-lg border-[0.7px] p-4 bg-sidebar">
          <DialogHeader>
            <DialogTitle>
              {actionType === "edit" ? "Edit Chat" : "Are you absolutely sure?"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "edit" ? (
                <>
                  <span className="text-sm text-zinc-600">
                    Edit the chat name
                  </span>
                  <input
                    type="text"
                    className="w-full mt-2 p-2 border rounded-md text-white/80"
                    placeholder="Learning react..."
                    ref={inputRef}
                  />
                </>
              ) : (
                <span className="text-zinc-500">
                  This action cannot be undone. This will permanently delete
                  your chat and remove your data from our servers.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-end gap-x-4 mt-5">
            <Button
              variant="ghost"
              className="text-gray-300 transition-all duration-300 rounded-[3px] cursor-pointer"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="text-gray-300 hover:bg-red-400 transition-all duration-300 rounded-[3px] cursor-pointer"
              onClick={() => {
                if (actionType === "edit") {
                  renameChat();
                } else if (actionType === "delete") {
                  deleteChat();
                }
                setOpen(false);
              }}
            >
              {actionType === "edit" ? "Save" : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChatLabel;
