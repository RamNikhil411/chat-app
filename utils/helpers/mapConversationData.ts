import { Chat } from "@/components/chatLayout/ChatSidebar";

function mapChatApiToUI(apiChats: any[]): Chat[] {
  const seen = new Set<number>();

  return apiChats
    .filter((chat) => chat.last_message)
    .filter((chat) => {
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
        first_name: firstName,
        last_name: lastName,
        email,
        lastMessage: chat.last_message?.content || "",
        time: "",
        unread: 0,
        avatar: "",
        isOnline: false,
        isGroup: chat.is_group,
        conversation_id: chat.receiver?.conversation_id,
      };
    });
}

export default mapChatApiToUI;
