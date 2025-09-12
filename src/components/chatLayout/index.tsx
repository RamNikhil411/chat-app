import { useState } from "react";

import { ChatArea } from "./ChatArea";
import { ChatSidebar } from "./ChatSidebar";

export const ChatLayout = () => {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);

  return (
    <div className="flex h-screen bg-chat-bg">
      <ChatSidebar selectedChat={selectedChat} onSelectChat={setSelectedChat} />
      <ChatArea selectedChat={selectedChat} />
    </div>
  );
};
