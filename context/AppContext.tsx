"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { User } from "@clerk/nextjs/server";

// Define props interface for AppProvider
interface AppContextProps {
  children?: React.ReactNode;
}

// Define the Chat interface
interface Chat {
  updatedAt: string;
}

// Define the type for the context value
interface AppContextValue {
  user: ReturnType<typeof useUser>["user"]; // Type from Clerk's useUser
  chat: Chat[]; // Array of Chat objects
  setChat: React.Dispatch<React.SetStateAction<Chat[]>>; // Setter for chat
  selectedChat: Chat | null; // Currently selected chat
  setSelectedChat: React.Dispatch<React.SetStateAction<Chat | null>>; // Setter for selectedChat
  createNewChat: () => Promise<void | null>; // Function to create a new chat
  fetchUserChats: () => Promise<void | null>; // Function to fetch chats
}

// Create the context with an initial empty object, typed properly
const AppContext = createContext<AppContextValue>({} as AppContextValue);

// Custom hook to access the AppContext with proper typing
export const useAppContext = () => {
  return useContext(AppContext);
};

// AppProvider component to wrap the app and provide context
export const AppProvider = ({ children }: AppContextProps) => {
  const { user } = useUser();
  const { getToken } = useAuth();

  const [chat, setChat] = useState<Chat[]>([]); // State for chat list
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null); // State for selected chat
  const [isCreatingChat, setIsCreatingChat] = useState(false); // Flag to prevent concurrent creation

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
      await fetchUserChats(); // Refresh chat list
    } catch (error) {
      toast.error("Failed to create chat.");
      console.error("Error creating chat:", error);
    } finally {
      setIsCreatingChat(false); // Reset flag
    }
  };

  // Function to fetch user's chats
  const fetchUserChats = async () => {
    if (!user) return null;

    const token = await getToken();

    try {
      const res = await axios.get("/api/chat/getchat", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Fetched chats:", res.data);
      const fetchedChats = res.data;

      setChat(fetchedChats);

      if (fetchedChats.length === 0 && !isCreatingChat) {
        await createNewChat(); // Create a chat if none exist
      } else {
        const sortedChats = [...fetchedChats].sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        setChat(sortedChats); // Update with sorted chats
        setSelectedChat(sortedChats[0] || null); // Set most recent chat
      }
      toast.success("Chats fetched successfully!");
    } catch (error) {
      console.error("Error fetching chats:", error);
      toast.error("Failed to fetch chats.");
    }
  };

  // Effect to fetch chats when user ID changes
  useEffect(() => {
    if (user?.id) {
      fetchUserChats();
    }
  }, [user?.id]);

  // Context value with all properties and functions
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
