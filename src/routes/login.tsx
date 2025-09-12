import { LoginScreen } from "@/auth/LoginComponent";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  component: LoginScreen,
});
