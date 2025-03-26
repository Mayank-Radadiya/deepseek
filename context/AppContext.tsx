// AppContext.tsx
"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

// Define the Message interface
interface Message {
  role: string;
  content: string;
  timeStamp: number;
}

// Define the Chat interface
interface Chat {
  _id: string;
  messages: Message[];
  userId: string;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AppContextProps {
  children?: React.ReactNode;
}

interface AppContextValue {
  user: ReturnType<typeof useUser>["user"];
  chat: Chat[];
  setChat: React.Dispatch<React.SetStateAction<Chat[]>>;
  selectedChat: Chat | null;
  setSelectedChat: React.Dispatch<React.SetStateAction<Chat | null>>;
  createNewChat: () => Promise<void | null>;
  fetchUserChats: () => Promise<void | null>;
}

const AppContext = createContext<AppContextValue>({} as AppContextValue);

export const useAppContext = () => {
  return useContext(AppContext);
};

export const AppProvider = ({ children }: AppContextProps) => {
  const { user } = useUser();
  const { getToken } = useAuth();

  const [chat, setChat] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  const createNewChat = async () => {
    if (!user || isCreatingChat) return null;

    setIsCreatingChat(true);
    const token = await getToken();

    try {
      await axios.post(
        "/api/chat/create",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Chat created successfully!");
      await fetchUserChats();
    } catch (error) {
      toast.error("Failed to create chat.");
      console.error("Error creating chat:", error);
    } finally {
      setIsCreatingChat(false);
    }
  };

  const fetchUserChats = async () => {
    if (!user) return null;

    const token = await getToken();

    try {
      const res = await axios.get("/api/chat/getchat", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fetchedChats: Chat[] = res.data;

      setChat(fetchedChats);

      if (fetchedChats.length === 0 && !isCreatingChat) {
        await createNewChat();
      } else {
        const sortedChats = [...fetchedChats].sort(
          (a, b) =>
            new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime()
        );
        setChat(sortedChats);
        setSelectedChat(sortedChats[0] || null);
      }
      toast.success("Chats fetched successfully!");
    } catch (error) {
      console.error("Error fetching chats:", error);
      toast.error("Failed to fetch chats.");
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchUserChats();
    }
  }, [user?.id]);

  const value: AppContextValue = {
    user,
    chat,
    setChat,
    selectedChat,
    setSelectedChat,
    createNewChat,
    fetchUserChats,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContext;
