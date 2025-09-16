import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AddConversationAPI,
  GetConversationsAPI,
  GetUsersAPI,
} from "@/http/services/chat";
import { cn } from "@/lib/utils";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, MessageSquarePlus, MoreVertical, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import mapChatApiToUI from "utils/helpers/mapConversationData";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

export interface Chat {
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
  selectedChat: User | null;
  onSelectChat: (chat: User) => void;
  onSelectConversation: (conversation: any) => void;
}
interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export const ChatSidebar = ({
  selectedChat,
  onSelectChat,
  onSelectConversation,
}: ChatSidebarProps) => {
  const {
    data: UsersQueryData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["users"],
    queryFn: async ({ pageParam = 1 }) => {
      let queryParams = { page: pageParam, page_size: 10 };
      const response = await GetUsersAPI(pageParam);

      return response?.data?.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const currentPage = lastPage?.pagination_info?.current_page;
      const totalPages = lastPage?.pagination_info?.total_pages;
      return currentPage && currentPage < totalPages ? currentPage + 1 : null;
    },
  });

  const UsersData = UsersQueryData?.pages?.map((page) => page?.records).flat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { mutate: createChat } = useMutation({
    mutationKey: ["createChat"],
    mutationFn: async (payload: { receiver_id: number }) => {
      const response = await AddConversationAPI(payload);
      return response?.data?.data;
    },

    onSuccess: (newConversation) => {
      if (newConversation) {
        onSelectConversation(newConversation);
      }
    },
  });

  const { data: conversations } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const response = await GetConversationsAPI();
      const data = response?.data?.data;
      // console.log(data);
      return mapChatApiToUI(data);
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = UsersData?.filter((user: User) => {
    const fullName = `${user?.first_name} ${user?.last_name}`.toLowerCase();
    return (
      fullName.includes(searchTerm.toLowerCase()) ||
      user?.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  console.log(filteredUsers);

  const handleCreateChat = (user: User) => {
    createChat({ receiver_id: user.id });
    onSelectChat(user);
  };

  useEffect(() => {
    if (!scrollRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage?.();
        }
      },
      {
        root: containerRef.current,
        rootMargin: "0px",
        threshold: 1.0,
      }
    );

    observer.observe(scrollRef.current);

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <div className="w-80 bg-secondary border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-secondary-foreground">
            Chats
          </h2>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-secondary-foreground hover:bg-secondary-foreground/10"
                >
                  <MessageSquarePlus className="w-5 h-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-80 p-2 bg-secondary shadow-lg rounded-xl"
              >
                <h3 className="text-sm font-medium text-secondary-foreground mb-2">
                  Start new chat
                </h3>

                {/* Search Users */}
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-secondary-foreground/5 border-secondary-foreground/10 text-secondary-foreground placeholder:text-secondary-foreground/60"
                  />
                </div>

                {/* User List */}
                <ScrollArea ref={containerRef} className="h-64">
                  {filteredUsers && filteredUsers?.length > 0 ? (
                    <div>
                      {filteredUsers?.map((user: User) => {
                        const fullName = `${user?.first_name} ${user?.last_name}`;
                        return (
                          <div
                            key={user?.id}
                            onClick={() => handleCreateChat(user)}
                            className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-secondary-foreground/5"
                          >
                            <Avatar className="w-10 h-10">
                              <AvatarFallback>
                                {user?.first_name?.charAt(0).toUpperCase()}
                                {user?.last_name?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium text-sm text-secondary-foreground truncate">
                                {fullName}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {user?.email}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      {hasNextPage && (
                        <div
                          ref={scrollRef}
                          className="flex items-center justify-center gap-3 p-2 rounded-lg cursor-pointer  hover:bg-secondary-foreground/5"
                        >
                          <Loader2 className="w-5 h-5 animate-spin text-secondary-foreground " />
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground p-3 text-center">
                      No users found
                    </p>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>
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
          {conversations?.map((chat, index) => (
            <div
              key={chat.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 animate-fade-in hover:scale-[1.02]",
                selectedChat?.id === parseInt(chat.id)
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
