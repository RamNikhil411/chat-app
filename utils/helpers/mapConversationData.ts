import { Chat } from "@/components/chatLayout/ChatSidebar";

function mapChatApiToUI(apiChats: any[]): Chat[] {
  const seen = new Set<number>();

  return apiChats
    .filter((chat) => chat.last_message) // ✅ only keep chats with messages
    .filter((chat) => {
      // ✅ prevent duplicate ids
      if (seen.has(chat.id)) return false;
      seen.add(chat.id);
      return true;
    })
    .map((chat) => {
      const firstName = chat.receiver?.first_name || "";
      const lastName = chat.receiver?.last_name || "";
      const email = chat.receiver?.email || "";

      return {
        id: chat.id.toString(),
        name:
          firstName || lastName
            ? `${firstName} ${lastName}`.trim()
            : email || "Unknown User",
        lastMessage: chat.last_message?.content || "",
        time: "", // can map to created_at if available
        unread: 0,
        avatar: "",
        isOnline: false,
        isGroup: chat.is_group,
      };
    });
}

export default mapChatApiToUI;
