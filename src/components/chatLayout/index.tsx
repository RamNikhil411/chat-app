import { useState } from "react";

import { ChatArea } from "./ChatArea";
import { ChatSidebar } from "./ChatSidebar";

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export const ChatLayout = () => {
  const [selectedChat, setSelectedChat] = useState<User | null>(null);

  return (
    <div className="flex h-screen bg-chat-bg">
      <ChatSidebar selectedChat={selectedChat} onSelectChat={setSelectedChat} />
      <ChatArea selectedChat={selectedChat} />
    </div>
  );
};
