import { io, Socket } from "socket.io-client";
import Cookies from "js-cookie";

let socket: Socket | null = null;

export const initSocket = () => {
  if (typeof window === "undefined") return;
  if (!socket) {
    const token = Cookies.get("token");
    if (!token) throw new Error("User token not found");

    const SOCKET_URL = import.meta.env.VITE_PUBLIC_SOCKET_URL;
    console.log(SOCKET_URL);
    if (!SOCKET_URL) throw new Error("SOCKET_URL not defined in env");

    socket = io(SOCKET_URL, {
      reconnectionDelayMax: 10000,
      query: {
        token: token,
      },
      transports: ["websocket"],
    });
  }
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    console.warn(
      "⚠️ Socket not initialized, calling initSocket() automatically"
    );
    return initSocket();
  }
  return socket;
};
