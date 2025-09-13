import { useEffect, useState } from "react";
import { ChatArea } from "./ChatArea";
import { ChatSidebar } from "./ChatSidebar";
import { initSocket } from "@/lib/socket";

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export const ChatLayout = () => {
  const [selectedChat, setSelectedChat] = useState<User | null>(null);

  useEffect(() => {
    const socket = initSocket();

    if (!socket) return;

    const handleConnect = () => {
      console.log("✅ Socket connected:", socket.id);
    };

    const handleDisconnect = () => {
      console.log("❌ Socket disconnected");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, []);

  return (
    <div className="flex h-screen bg-chat-bg">
      <ChatSidebar selectedChat={selectedChat} onSelectChat={setSelectedChat} />
      <ChatArea selectedChat={selectedChat} />
    </div>
  );
};
