"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import ChatLabel from "./ChatLabel";

interface ChatHistoryProps {
  userId: string;
}

interface chatProps {
  _id: string;
  name: string;
  userId: string;
}

const ChatHistory = ({ userId }: ChatHistoryProps) => {
  const [response, setResponse] = useState([]);
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const response = await axios.get("/api/chat/getchat");

        setResponse(response.data);
      } catch (error) {
        console.error("Error fetching chat history:", error);
      }
    };
    fetchChatHistory();
  }, [userId]);

  return (
    <>
      {response.map((chat: chatProps) => (
        <div key={chat._id}>
          <ChatLabel chatTitle={chat.name} id={chat._id} />
        </div>
      ))}
    </>
  );
};

export default ChatHistory;
