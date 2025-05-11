import React, { useEffect, useState } from "react";
import { Send } from "lucide-react";
import axios from "axios";
import socket from "../socket";

interface Message {
  clerkId: string;
  name: string;
  messages: string[];
}

interface User {
  clerkId: string;
  name: string;
  image: string;
}

interface ChatBoxProps {
  currentRoom: string;
  clerkId: string;
}

const ChatBox: React.FC<ChatBoxProps> = ({ currentRoom, clerkId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [input, setInput] = useState("");

  console.log("Current Room:", currentRoom, "Clerk ID:", clerkId);

  // Function to send messages
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission

    if (!input.trim()) return; // Avoid sending empty messages

    // Find the sender's name based on the clerkId
    const sender = users.find((user) => user.clerkId === clerkId);
    const senderName = sender ? sender.name : "Unknown";

    const newMessage = { clerkId, name: senderName, messages: [input] };
    setMessages((prev) => [...prev, newMessage]);

    socket.emit("sendMessage", {
      room: currentRoom,
      clerkId,
      name: senderName, // Send name along with the message
      messages: input,
    });

    setInput(""); // Clear input field after sending
  };

  useEffect(() => {
    // Fetch initial messages when component mounts
    const getMessages = async () => {
      try {
        const response = await axios.get(
          "https://flowboard-1uw3.onrender.com/api/v1/board/get-messages",
          { params: { currentRoom } }
        );

        console.log("Room Data:", response.data);
        console.log(response);

        setUsers(response.data.users);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };
    getMessages();

    // Listen for incoming messages
    socket.on("receiveMessage", (newMessage) => {
      console.log("New Message Received:", newMessage);
      setMessages((prev) => [...prev, newMessage]);
    });

    // Cleanup the listener when component unmounts
    return () => {
      socket.off("receiveMessage");
    };
  }, [currentRoom]);
  console.log(users);

  console.log("Messages:", messages);

  return (
    <div className="flex flex-col w-full max-w-md rounded-2xl shadow-lg bg-white h-screen">
      {/* Users List */}
      <div className="flex flex-wrap gap-2 p-4 border-b">
        {users.map((user, index) => (
          <div
            key={index}
            className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg shadow"
          >
            <img
              src={user.image}
              alt={user.name}
              className="w-8 h-8 rounded-full"
            />
            <span className="font-medium">
              {user.name ? user.name : "User"}
            </span>
          </div>
        ))}
      </div>

      {/* Messages Display */}
      <div className="h-4/6 overflow-y-auto p-4 space-y-4">
        {messages.map((userMessages, index) => {
          const currentUser = users.find((user) => user.clerkId === clerkId);
          return (
            <div key={index} className="flex flex-col">
              <span className="font-bold text-gray-700">
                {userMessages.name ? userMessages.name : "User"}
              </span>
              <div className="space-y-1">
                {userMessages.messages.map((msg, msgIndex) => (
                  <div
                    key={msgIndex}
                    className={`p-2 rounded-xl max-w-xs ${
                      currentUser
                        ? "bg-blue-500 text-white self-end ml-auto"
                        : "bg-gray-200 text-black self-start"
                    }`}
                  >
                    {msg}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input and Send Button */}
      <form
        className="flex items-center p-2 border-t h-1/6 rounded-2xl"
        onSubmit={handleSendMessage}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 p-2 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type a message..."
        />
        <button
          type="submit"
          className="ml-2 bg-blue-500 text-white p-2 rounded-2xl hover:bg-blue-600"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default ChatBox;
