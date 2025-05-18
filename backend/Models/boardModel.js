import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // Clerk ID of sender
  name: { type: String, required: true }, // Sender name
  image: { type: String }, // Sender profile image
  messages: [{ type: String, required: true }], // Array of messages from the sender
});

const boardSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true }, // Unique room ID
  users: [{ type: String, ref: "User" }], // Array of User clerkIds
  pencil: { type: Array, default: [] },
  lines: { type: Array, default: [] },
  circles: { type: Array, default: [] },
  brush: { type: Array, default: [] },
  eraser: { type: Array, default: [] },
  images: { type: Array, default: [] },
});

const Board = mongoose.model("Board", boardSchema);
export default Board;
