import { Check, CheckCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  text: string;
  time: Date;
  isSent: boolean;
  status: "sent" | "delivered" | "seen";
  avatar?: string;
  sender?: string;
}

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  return (
    <div
      className={cn(
        "flex items-end gap-2 max-w-[70%] group",
        message.isSent ? "ml-auto flex-row-reverse" : "mr-auto"
      )}
    >
      {!message.isSent && (
        <Avatar className="w-8 h-8 transition-transform duration-200 group-hover:scale-110">
          <AvatarImage src={message.avatar} />
          <AvatarFallback className="bg-primary/20 text-primary text-xs">
            {message.sender ? message.sender[0] : "U"}
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          "px-4 py-2 rounded-2xl max-w-full break-words transition-all duration-200 hover:scale-[1.02] hover:shadow-md",
          message.isSent
            ? "bg-primary text-white rounded-br-md"
            : "bg-accent text-foreground rounded-bl-md"
        )}
      >
        <p className="text-sm">{message.text}</p>
      </div>

      <div className="flex flex-col items-end gap-1 min-w-fit">
        <span className="text-xs text-muted-foreground opacity-70 group-hover:opacity-100 transition-opacity duration-200">
          {new Date(message.time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>

        {message.isSent && (
          <div className="flex items-center transition-transform duration-200 group-hover:scale-110">
            {message.status === "sent" && (
              <Check className="w-3 h-3 text-muted-foreground animate-bounce-in" />
            )}
            {message.status === "delivered" && (
              <CheckCheck className="w-3 h-3 text-muted-foreground animate-bounce-in" />
            )}
            {message.status === "seen" && (
              <CheckCheck className="w-3 h-3 text-primary animate-bounce-in" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
