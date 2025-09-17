import { useEffect, useState } from "react";
import { ChatArea } from "./ChatArea";
import { ChatSidebar } from "./ChatSidebar";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import Cookies from "js-cookie";

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  conversation_id?: number;
}

export const ChatLayout = () => {
  const [selectedChat, setSelectedChat] = useState<User | null>(null);

  const [selectConversation, setSelectConversation] = useState<any | null>(
    null
  );

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) return;

    const socket = connectSocket(token);

    const handleConnect = () => {
      console.log("✅ Socket connected:", socket?.id);
    };

    const handleDisconnect = () => {
      console.log("❌ Socket disconnected");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      disconnectSocket();
    };
  }, []);

  return (
    <div className="flex h-screen bg-chat-bg">
      <ChatSidebar
        selectedChat={selectedChat}
        setSelectedChat={setSelectedChat}
        onSelectConversation={setSelectConversation}
      />
      <ChatArea selectedChat={selectedChat} />
    </div>
  );
};
