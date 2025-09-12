import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, MoreVertical, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  avatar: string;
  isOnline: boolean;
  isGroup: boolean;
  lastSeen?: string;
}

interface ChatSidebarProps {
  selectedChat: string | null;
  onSelectChat: (chatId: string) => void;
}

export const ChatSidebar = ({
  selectedChat,
  onSelectChat,
}: ChatSidebarProps) => {
  const chats: Chat[] = [
    {
      id: "1",
      name: "Sarah Johnson",
      lastMessage: "Hey! How's your day going?",
      time: "2:30 PM",
      unread: 2,
      avatar: "",
      isOnline: true,
      isGroup: false,
    },
    {
      id: "2",
      name: "Team Alpha",
      lastMessage: "Mike: The project looks great!",
      time: "1:45 PM",
      unread: 5,
      avatar: "",
      isOnline: false,
      isGroup: true,
    },
    {
      id: "3",
      name: "Alex Chen",
      lastMessage: "Thanks for the help earlier",
      time: "12:20 PM",
      unread: 0,
      avatar: "",
      isOnline: false,
      isGroup: false,
      lastSeen: "last seen 1 hour ago",
    },
    {
      id: "4",
      name: "Design Team",
      lastMessage: "Emma: New mockups are ready",
      time: "11:30 AM",
      unread: 1,
      avatar: "",
      isOnline: false,
      isGroup: true,
    },
    {
      id: "5",
      name: "Maria Garcia",
      lastMessage: "See you tomorrow!",
      time: "Yesterday",
      unread: 0,
      avatar: "",
      isOnline: true,
      isGroup: false,
    },
    {
      id: "6",
      name: "John Smith",
      lastMessage: "The meeting went well",
      time: "Yesterday",
      unread: 0,
      avatar: "",
      isOnline: false,
      isGroup: false,
      lastSeen: "last seen yesterday",
    },
  ];

  return (
    <div className="w-80 bg-secondary border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-secondary-foreground">
            Chats
          </h2>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-secondary-foreground hover:bg-secondary-foreground/10"
            >
              <MessageSquarePlus className="w-5 h-5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-secondary-foreground hover:bg-secondary-foreground/10"
            >
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-10 bg-secondary-foreground/5 border-secondary-foreground/10 text-secondary-foreground placeholder:text-secondary-foreground/60"
          />
        </div>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {chats.map((chat, index) => (
            <div
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 animate-fade-in hover:scale-[1.02]",
                selectedChat === chat.id
                  ? "bg-primary/10 border border-primary/20 shadow-md"
                  : "hover:bg-secondary-foreground/5 hover:shadow-sm"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="relative group">
                <Avatar className="w-12 h-12 transition-transform duration-200 group-hover:scale-110">
                  <AvatarImage src={chat.avatar} />
                  <AvatarFallback className="bg-primary/20 text-primary font-medium">
                    {chat.isGroup
                      ? "👥"
                      : chat.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                  </AvatarFallback>
                </Avatar>
                {chat.isOnline && !chat.isGroup && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-online border-2 border-secondary rounded-full animate-pulse" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium text-secondary-foreground truncate">
                    {chat.name}
                  </h3>
                  <span className="text-xs text-secondary-foreground/60 flex-shrink-0">
                    {chat.time}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-secondary-foreground/70 truncate">
                    {chat.lastMessage}
                  </p>
                  {chat.unread > 0 && (
                    <Badge className="bg-primary text-primary-foreground text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full">
                      {chat.unread}
                    </Badge>
                  )}
                </div>
                {!chat.isOnline && !chat.isGroup && chat.lastSeen && (
                  <p className="text-xs text-secondary-foreground/50 mt-1">
                    {chat.lastSeen}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
