import { createFileRoute } from "@tanstack/react-router";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get("Token"); // Replace "Token" with your cookie key
    if (token) {
      navigate({ to: "/chat" });
    } else {
      navigate({ to: "/login" });
    }
    // Optional: small delay to show the loader smoothly
    setTimeout(() => setLoading(false), 300);
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return null;
}
