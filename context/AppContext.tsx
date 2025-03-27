"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

interface Message {
  role: string;
  content: string;
  timeStamp: number;
}

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
  isLoadingChats: boolean;
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
  const [isLoadingChats, setIsLoadingChats] = useState(false);

  useEffect(() => {
    if (selectedChat) {
      localStorage.setItem("selectedChatId", selectedChat._id);
    }
  }, [selectedChat]);

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
      await fetchUserChats();
    } catch (error) {
      console.error("Error creating chat:", error);
    } finally {
      setIsCreatingChat(false);
    }
  };

  const fetchUserChats = async () => {
    if (!user) return null;

    setIsLoadingChats(true);
    const token = await getToken();

    try {
      const { data } = await axios.get("/api/chat/getchat", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Ensure data is an array and format it
      const fetchedChats: Chat[] = Array.isArray(data) ? data : [];

      // Sort chats by updatedAt in descending order
      const sortedChats = [...fetchedChats].sort(
        (a, b) =>
          new Date(b.updatedAt ?? 0).getTime() -
          new Date(a.updatedAt ?? 0).getTime()
      );

      setChat(sortedChats);
      console.log("Fetched and sorted chats:", sortedChats);

      // Restore selectedChat from localStorage or use most recent
      const storedChatId = localStorage.getItem("selectedChatId");
      const chatToSelect =
        sortedChats.find((chat) => chat._id === storedChatId) ||
        sortedChats[0] ||
        null;

      if (sortedChats.length === 0 && !isCreatingChat) {
        await createNewChat();
      } else {
        setSelectedChat(chatToSelect);
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setIsLoadingChats(false);
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
    isLoadingChats,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContext;
