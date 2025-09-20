import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GetMessagesAPI } from "@/http/services/chat";
import { getSocket } from "@/lib/socket";
import { getUserState } from "@/store/userDetails";
import { useInfiniteQuery } from "@tanstack/react-query";
import EmojiPicker from "emoji-picker-react";
import {
  ArrowDown,
  MoreVertical,
  Paperclip,
  Phone,
  Search,
  Send,
  Smile,
  Users,
  Video,
} from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  groupAndSortMessages,
  GroupedMessages,
} from "utils/helpers/sortedMessage";
import { transformApiMessages } from "utils/helpers/transformMessageApi";
import { User } from ".";
import { FileUpload } from "./FileUpload";
import { MessageBubble } from "./MessageBubble";

interface Message {
  id: string;
  text: string;
  time: Date;
  isSent: boolean;
  status: "sent" | "delivered" | "seen";
  avatar?: string;
  sender?: string;
}

interface ChatAreaProps {
  selectedChat: User | null;
}

export const ChatArea = ({ selectedChat }: ChatAreaProps) => {
  const { user: userDetails } = getUserState();
  const socket = getSocket();

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const {
    data: getMessages,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ["messages", selectedChat?.conversation_id],
    queryFn: async ({ pageParam = 1 }) => {
      let queryParams = { page: pageParam, page_size: 10 };

      const response = await GetMessagesAPI(
        selectedChat?.conversation_id,
        queryParams
      );

      return response?.data?.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const current = lastPage?.pagination_info?.current_page;
      const total = lastPage?.pagination_info?.total_pages;
      if (!current || !total) return undefined;
      return current < total ? current + 1 : undefined; // only if fetchNextPage is called
    },
    enabled: !!selectedChat?.conversation_id,
  });

  const [message, setMessage] = useState("");
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [curMsgId, setCurMsgId] = useState("");

  const [messages, setMessages] = useState<any[]>([]);
  const [groupedMessages, setGroupedMessages] = useState<GroupedMessages[]>([]);

  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [newMsgCount, setNewMsgCount] = useState(0);
  const [isBottom, setIsBottom] = useState(true);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const topMessageRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const isChatSwitchingRef = useRef(false);

  const handleEmojiClick = (emojiData: any) => {
    setMessage((prev) => prev + emojiData.emoji);
  };

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  useEffect(() => {
    if (selectedChat) {
      isChatSwitchingRef.current = true;
    }
  }, [selectedChat?.conversation_id]);

  useEffect(() => {
    const scrollEl = scrollAreaRef.current?.querySelector(
      '[data-slot="scroll-area-viewport"]'
    );

    if (!scrollEl) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollEl as HTMLElement;
      const atBottom = scrollHeight - scrollTop - clientHeight < 10;

      setIsBottom(atBottom);

      if (atBottom) {
        setNewMsgCount(0);
      }
    };

    scrollEl.addEventListener("scroll", handleScroll);
    return () => scrollEl.removeEventListener("scroll", handleScroll);
  }, [selectedChat]);

  useLayoutEffect(() => {
    if (!groupedMessages.length) return;

    const scrollEl = scrollAreaRef.current?.querySelector(
      '[data-slot="scroll-area-viewport"]'
    ) as HTMLElement;
    if (!scrollEl) return;

    // if switching chat, scroll instantly to bottom
    if (isChatSwitchingRef.current) {
      scrollEl.scrollTop = scrollEl.scrollHeight;
      isChatSwitchingRef.current = false;
      return;
    }

    // normal behavior: scroll to bottom only if user was already at bottom
    if (isBottom) {
      scrollEl.scrollTop = scrollEl.scrollHeight;
    }
  }, [groupedMessages, isBottom]);

  useEffect(() => {
    console.log(newMsgCount, "bj");
  }, [newMsgCount]);

  useEffect(() => {
    if (!topMessageRef.current || !getMessages) return;

    const scrollEl = scrollAreaRef.current?.querySelector(
      '[data-slot="scroll-area-viewport"]'
    ) as HTMLElement;
    if (!scrollEl || !hasNextPage) return;

    let timer: NodeJS.Timeout | null = null;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Start a 500ms delay before triggering API
          if (!timer) {
            timer = setTimeout(() => {
              const prevScrollHeight = scrollEl.scrollHeight;
              console.log("calling API after 500ms delay");

              fetchNextPage().then(() => {
                const extraOffset = 50;
                scrollEl.scrollTop =
                  scrollEl.scrollHeight - prevScrollHeight + extraOffset;
              });

              timer = null;
            }, 500);
          }
        } else {
          // Reset timer if user scrolls away
          if (timer) {
            clearTimeout(timer);
            timer = null;
          }
        }
      },
      { root: scrollAreaRef.current, threshold: 1 }
    );

    observer.observe(topMessageRef.current);

    return () => {
      if (timer) clearTimeout(timer);
      observer.disconnect();
    };
  }, [getMessages, topMessageRef, fetchNextPage, hasNextPage, selectedChat]);

  useEffect(() => {
    if (!getMessages) return;

    const messagesData =
      getMessages.pages
        ?.map((page) => transformApiMessages(page?.records, userDetails?.id))
        .flat() ?? [];

    setMessages(messagesData);
  }, [getMessages, userDetails?.id]);

  useEffect(() => {
    setGroupedMessages(groupAndSortMessages(messages));
  }, [messages]);

  useEffect(() => {
    if (!selectedChat) return;

    const handleIncomingMessage = (data: any) => {
      if (data.type === "direct:message:new") {
        const msg = data.payload;
        if (msg.from === selectedChat?.id) {
          setMessages((prev) => [
            ...prev,
            {
              id: String(Date.now()),
              text: msg.content,
              time: new Date(),
              isSent: false,
              status: "delivered",
            },
          ]);
        }

        if (!isBottom) {
          setNewMsgCount((prev) => prev + 1);
        }
      }

      if (data.type === "direct:message:ack") {
        setMessages((prev) =>
          prev.map((msg) =>
            msg?.id === data.payload.messageId
              ? { ...msg, status: "delivered" }
              : msg
          )
        );

        setCurMsgId(data.payload.messageId);
      }

      if (data.type === "message:read:ack") {
        setMessages((prev) =>
          prev.map((msg) =>
            msg?.id === data.payload.messageId
              ? { ...msg, status: "seen" }
              : msg
          )
        );
      }
    };

    const handleTyping = (data: any) => {
      console.log(selectedChat);

      console.log(data.payload);

      if (data.payload.conversationId !== selectedChat?.conversation_id) return;
      console.log("dhvjk");
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

  const handleSendMessage = () => {
    if (!message.trim() || !selectedChat) return;

    const newMsg = {
      id: String(Date.now()),
      text: message,
      time: new Date(),
      isSent: true,
      status: "sending",
    };

    setMessages((prev) => [...prev, newMsg]);
    setMessage("");
    scrollToBottom();
    setNewMsgCount(0);

    socket?.emit("message", {
      type: "message:send",
      payload: {
        temp_id: newMsg?.id,
        conversationId: selectedChat.conversation_id,
        receiverId: selectedChat?.id,
        content: newMsg.text,
      },
    });
  };

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
            messageId: msg?.id,
            receiverId: selectedChat?.id,
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

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingActiveRef = useRef(false);

  const TYPING_STOP_DELAY = 500;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);

    if (!socket || !selectedChat) return;

    // 1. Send typing:start immediately if not already sent
    if (!typingActiveRef.current) {
      socket.emit("message", {
        type: "typing:start",
        payload: {
          receiverId: selectedChat.id,
          from: userDetails.id,
          conversationId: selectedChat.conversation_id,
        },
      });
      typingActiveRef.current = true;
    }

    // 2. Clear previous stop timer
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // 3. Set new stop timer
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("message", {
        type: "typing:stop",
        payload: {
          receiverId: selectedChat.id,
          from: userDetails.id,
          conversationId: selectedChat.conversation_id,
        },
      });
      typingActiveRef.current = false;
      typingTimeoutRef.current = null;
    }, TYPING_STOP_DELAY);

    // 4. If input cleared, stop immediately
    if (value.trim() === "") {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socket.emit("message", {
        type: "typing:stop",
        payload: {
          receiverId: selectedChat.id,
          from: userDetails.id,
          conversationId: selectedChat.conversation_id,
        },
      });
      typingActiveRef.current = false;
      typingTimeoutRef.current = null;
    }
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
        time: new Date(),
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

  const chatInfo = {
    id: selectedChat?.id,
    name: `${selectedChat.first_name} ${selectedChat.last_name} `,
    avatar: "",
    isOnline: true,
    isGroup: false,
    members: 1,
  };

  return (
    <div className="flex-1 flex flex-col bg-chat-bg">
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
                  : otherUserTyping
                    ? "Typing..."
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

      <ScrollArea className="flex-1 p-4 overflow-auto " ref={scrollAreaRef}>
        <div className="space-y-4">
          <div ref={topMessageRef}></div>
          {groupedMessages.map((group) => (
            <div key={group.date}>
              <div className="text-center text-xs text-muted-foreground my-2">
                {group.label}
              </div>
              <div className="space-y-4">
                {group.messages.map((msg) => (
                  <MessageBubble key={msg?.id} message={msg} />
                ))}
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} className="" />
          {otherUserTyping && (
            <div className="text-sm text-muted-foreground ml-2 mb-1">
              {selectedChat.first_name} is typing...
            </div>
          )}
        </div>

        {!isBottom && (
          <Button
            onClick={() => {
              scrollToBottom();
              setNewMsgCount(0);
            }}
            className="absolute hover:text-white bg-white text-primary border border-primary right-1/2 translate-x-1/2 bottom-10"
          >
            <ArrowDown />
            {newMsgCount > 0 && (
              <div className="font-medium text-red-500">{newMsgCount}</div>
            )}
          </Button>
        )}
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
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground hover:scale-110 transition-transform duration-200"
            >
              <Smile className="w-5 h-5" />
            </Button>
            {showEmojiPicker && (
              <div
                ref={emojiPickerRef}
                className="absolute bottom-12 left-0 z-50"
              >
                <EmojiPicker onEmojiClick={handleEmojiClick} />
              </div>
            )}
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
