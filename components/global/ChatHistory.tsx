"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import ChatLabel from "./ChatLabel";
import { useUser } from "@clerk/nextjs";

interface chatProps {
  _id: string;
  name: string;
  userId: string;
}

const ChatHistory = () => {
  const [response, setResponse] = useState([]);

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
