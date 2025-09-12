import { io, Socket } from "socket.io-client";
import Cookies from "js-cookie";

let socket: Socket | null = null;

export const initSocket = () => {
  if (!socket) {
    const token = Cookies.get("token");
    if (!token) throw new Error("User token not found");

    socket = io("wss://api-chat-app-io.onrender.com", {
      reconnectionDelayMax: 10000,
      query: { token },
    });
  }
  return socket;
};

export const getSocket = () => {
  if (!socket) throw new Error("Socket not initialized");
  return socket;
};
