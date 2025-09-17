import { Message } from "@/lib/interface/chat";

export function transformApiMessages(
  apiMessages: any[],
  currentUserId: number
): Message[] {
  return apiMessages?.map((msg) => ({
    id: String(msg.id),
    text: msg.content,
    time: msg.created_at,
    isSent: msg.sender_id === currentUserId,
    status: "seen",
    avatar: undefined,
    sender:
      `${msg.sender_first_name || ""} ${msg.sender_last_name || ""}`.trim(),
  }));
}
