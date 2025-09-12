import { ChatLayout } from "@/components/chatLayout";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/chat/")({
  component: ChatLayout,
});
