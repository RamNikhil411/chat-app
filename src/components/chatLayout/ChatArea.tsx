import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getSocket } from "@/lib/socket";
import { getUserState } from "@/store/userDetails";
import {
  MoreVertical,
  Paperclip,
  Phone,
  Search,
  Send,
  Smile,
  Users,
  Video,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FileUpload } from "./FileUpload";
import { MessageBubble } from "./MessageBubble";
import { Socket } from "socket.io-client";
import { SendMessageAPI } from "@/http/services/chat";
import { useMutation } from "@tanstack/react-query";

interface Message {
  id: string;
  text: string;
  time: string;
  isSent: boolean;
  status: "sent" | "delivered" | "seen";
  avatar?: string;
  sender?: string;
}
interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}
interface ChatAreaProps {
  selectedChat: User | null;
  selectedConversation: any;
}

export const ChatArea = ({
  selectedChat,
  selectedConversation,
}: ChatAreaProps) => {
  const { user: userDetails } = getUserState();
  const socket = getSocket();

  const [message, setMessage] = useState("");
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [curMsgId, setCurMsgId] = useState("");
  const [messages, setMessages] = useState<any[]>([
    {
      id: "1",
      text: "Hey! How's your day going?",
      time: "2:30 PM",
      isSent: false,
      status: "seen",
    },
    {
      id: "2",
      text: "It's going great! Just finished the presentation. Thanks for asking 😊",
      time: "2:32 PM",
      isSent: true,
      status: "seen",
    },
  ]);

  const [otherUserTyping, setOtherUserTyping] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationRef = useRef(selectedConversation);

  useEffect(() => {
    if (selectedConversation) {
      conversationRef.current = selectedConversation;
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!selectedChat) return;

    const handleIncomingMessage = (data: any) => {
      if (data.type === "direct:message:new") {
        const msg = data.payload;
        if (msg.from === selectedChat.id) {
          setMessages((prev) => [
            ...prev,
            {
              id: String(Date.now()),
              text: msg.content,
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              isSent: false,
              status: "delivered",
            },
          ]);
        }
      }

      if (data.type === "direct:message:ack") {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === data.payload.messageId
              ? { ...msg, status: "delivered" }
              : msg
          )
        );

        setCurMsgId(data.payload.messageId);
      }

      if (data.type === "message:read:ack") {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === data.payload.messageId ? { ...msg, status: "seen" } : msg
          )
        );
      }
    };

    const handleTyping = (data: any) => {
      if (data.payload.chatId !== selectedChat.id) return;

      if (data.type === "typing:start") setOtherUserTyping(true);
      if (data.type === "typing:stop") setOtherUserTyping(false);
    };

    socket?.on("message", handleIncomingMessage);
    socket?.on("message", handleTyping);

    return () => {
      socket?.off("message", handleIncomingMessage);
      socket?.off("message", handleTyping);
    };
  }, [selectedChat]);

  const { mutate: sendMessage } = useMutation({
    mutationKey: ["sendMessage"],
    mutationFn: SendMessageAPI,
    onMutate: async (payload) => {
      const tempId = `temp-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: tempId,
          text: payload.content,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          isSent: true,
          status: "sending",
        },
      ]);
      setMessage("");
      return { tempId };
    },
    onSuccess: (response, _variables, context) => {
      // Replace temp message with real one

      const savedMessage = response?.data?.data;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === context?.tempId
            ? {
                ...msg,
                id: savedMessage.id,
                status: "sent",
                time: new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              }
            : msg
        )
      );

      // Emit socket event after backend confirms
      socket?.emit("message", {
        type: "message:send",
        payload: {
          messageId: savedMessage?.id,
          conversationId: selectedConversation?.conversation_id,
          receiverId: selectedChat?.id,
          content: savedMessage?.content,
        },
      });
    },
    onError: (_error, _variables, context) => {
      // Mark the temp message as failed
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === context?.tempId ? { ...msg, status: "failed" as any } : msg
        )
      );
    },
  });

  const handleSendMessage = () => {
    if (!message.trim() || !selectedChat || !selectedConversation) return;

    sendMessage({
      conversation_id: selectedConversation?.conversation_id,
      content: message,
    });
  };

  // ✅ Mark incoming messages as seen when chat is open
  useEffect(() => {
    if (!selectedChat || messages.length === 0) return;

    const unseenMessages = messages.filter(
      (msg) => !msg.isSent && msg.status !== "seen"
    );

    if (unseenMessages.length > 0) {
      unseenMessages.forEach((msg) => {
        socket?.emit("message", {
          type: "message:read",
          payload: {
            messageId: msg.id,
            receiverId: selectedChat.id,
          },
        });
      });

      setMessages((prev) =>
        prev.map((msg) =>
          !msg.isSent && msg.status !== "seen"
            ? { ...msg, status: "seen" }
            : msg
        )
      );
    }
  }, [messages, selectedChat, socket]);

  let typingTimeout: NodeJS.Timeout;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);

    socket?.emit("message", {
      type: "typing:start",
      payload: {
        receiverId: selectedChat?.id,
        from: userDetails.id,
        conversationId: selectedConversation?.conversation_id,
      },
    });

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket?.emit("message", {
        type: "typing:stop",
        payload: {
          receiverId: selectedChat?.id,
          from: userDetails.id,
          conversationId: selectedConversation?.conversation_id,
        },
      });
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFilesSelected = (files: any[]) => {
    files.forEach((filePreview) => {
      const newMessage: Message = {
        id: String(messages.length + 1 + Math.random()),
        text: `📎 ${filePreview.file.name}`,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isSent: true,
        status: "sent",
      };
      setMessages((prev) => [...prev, newMessage]);
    });
  };

  if (!selectedChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-chat-bg">
        <div className="text-center">
          <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mb-6 mx-auto">
            <Users className="w-16 h-16 text-primary/40" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Welcome to ChatFlow
          </h2>
          <p className="text-muted-foreground max-w-md">
            Select a conversation from the sidebar to start messaging with your
            friends and groups.
          </p>
        </div>
      </div>
    );
  }

  console.log(
    selectedChat.email,
    userDetails.email,
    selectedChat.email === userDetails.email
  );

  const chatInfo = {
    id: selectedChat.id,
    name: `${selectedChat.first_name} ${selectedChat.last_name} `,
    avatar: "",
    isOnline: true,
    isGroup: false,
    members: 1,
  };

  return (
    <div className="flex-1 flex flex-col bg-chat-bg">
      {/* Chat Header */}
      <div className="bg-card border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="w-10 h-10">
              <AvatarImage src={chatInfo.avatar} />
              <AvatarFallback className="bg-primary/20 text-primary font-medium">
                {chatInfo.isGroup
                  ? "👥"
                  : chatInfo.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
              </AvatarFallback>
            </Avatar>
            {chatInfo.isOnline && !chatInfo.isGroup && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-online border-2 border-card rounded-full" />
            )}
          </div>
          <div>
            <h3 className="font-medium text-foreground">{`${chatInfo.name} ${selectedChat.email === userDetails.email ? "(You)" : ""}`}</h3>
            <p className="text-xs text-muted-foreground">
              {chatInfo.isGroup
                ? `${chatInfo.members} members`
                : chatInfo.isOnline
                  ? "Online"
                  : "last seen recently"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
          >
            <Search className="w-5 h-5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
          >
            <Phone className="w-5 h-5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
          >
            <Video className="w-5 h-5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
          >
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4 overflow-auto " ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div
              key={msg.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <MessageBubble message={msg} />
            </div>
          ))}
          <div ref={messagesEndRef} />
          {otherUserTyping && (
            <div className="text-sm text-muted-foreground ml-2 mb-1">
              {selectedChat.first_name} is typing...
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="bg-card border-t border-border p-4">
        <div className="flex items-end gap-3">
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground hover:scale-110 transition-transform duration-200"
            onClick={() => setShowFileUpload(true)}
          >
            <Paperclip className="w-5 h-5" />
          </Button>

          <div className="flex-1 relative">
            <Input
              value={message}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="pr-12 py-3 min-h-[44px] rounded-xl"
            />
            <Button
              size="sm"
              variant="ghost"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground hover:scale-110 transition-transform duration-200"
            >
              <Smile className="w-5 h-5" />
            </Button>
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="bg-primary hover:bg-primary-dark text-white p-3 rounded-xl hover:scale-105 active:scale-95 transition-transform duration-200"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {showFileUpload && (
        <FileUpload
          onFilesSelected={handleFilesSelected}
          onClose={() => setShowFileUpload(false)}
        />
      )}
    </div>
  );
};
