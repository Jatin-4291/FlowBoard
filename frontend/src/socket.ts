import io from "socket.io-client";

const socket = io("https://flowboard-1uw3.onrender.com", {
  withCredentials: true,
}); // Backend URL

export default socket;
