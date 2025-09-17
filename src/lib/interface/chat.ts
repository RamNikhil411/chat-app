export interface Message {
  id: string;
  text: string;
  time: string;
  isSent: boolean;
  status: "sent" | "delivered" | "seen";
  avatar?: string;
  sender?: string;
}
