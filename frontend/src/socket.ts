import io from "socket.io-client";

const socket = io("https://flowboard-1uw3.onrender.com:5000"); // Backend URL

export default socket;
