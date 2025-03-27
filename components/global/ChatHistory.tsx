import ChatLabel from "./ChatLabel";
import { useAppContext } from "@/context/AppContext";

interface chatProps {
  _id: string;
  name: string;
  userId: string;
}

const ChatHistory = () => {
  const { chat, selectedChat } = useAppContext();

  const selectedChatId = selectedChat?._id;

  return (
    <>
      {chat.map((chat: chatProps) => (
        <div key={chat._id}>
          <ChatLabel
            chatTitle={chat.name}
            id={chat._id}
            selectedChatId={selectedChatId}
          />
        </div>
      ))}
    </>
  );
};

export default ChatHistory;
