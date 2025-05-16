import express from "express";
import cors from "cors";
import userRoutes from "./Routes/userRoutes.js";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./Models/userModels.js";
import { Webhook } from "svix";
import bodyParser from "body-parser";
import { updateRooms } from "./Controllers/userControllers.js";
import boardsRoutes from "./Routes/BoardsRoutes.js";
import {
  updateBoard,
  createBoard,
  eraseLines,
  removeAllData,
  dragData,
} from "./Controllers/boardControlllers.js";
dotenv.config();

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://flow-board-q4kyrhp5e-jatin-4291s-projects.vercel.app",
  // /^https:\/\/flow-board-.*\.vercel\.app$/,
];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
// ✅ Middleware to parse JSON bodies
app.post(
  "/api/webhooks",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      console.log("Webhook received");

      if (!process.env.CLERK_WEBHOOK_SECRET_KEY) {
        console.error("❌ Clerk Webhook Secret Key is missing!");
        return res
          .status(500)
          .json({ success: false, message: "Webhook secret key missing" });
      }

      const payloadString = req.body.toString();
      const svixHeaders = req.headers;

      const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET_KEY);
      const evt = wh.verify(payloadString, svixHeaders);

      const { id, ...attributes } = evt.data;
      const eventType = evt.type;

      console.log(`Received Clerk Event: ${eventType}`);

      if (eventType === "user.created") {
        const name = `${attributes.first_name} ${attributes.last_name}`;
        const clerkId = id;
        const profileImage = attributes.profile_image_url;
        const roomId = Math.floor(Math.random() * 1000000).toString();

        const user = new User({
          name,
          clerkId,
          profileImage,
          roomId,
        });
        await user.save();
        console.log("✅ User created in MongoDB:", user);
      }

      if (eventType === "user.deleted") {
        await User.findOneAndDelete({ clerkId: id });
        console.log("🗑️ User deleted from MongoDB:", id);
      }

      if (eventType === "user.updated") {
        const name = `${attributes.first_name} ${attributes.last_name}`;
        const profileImage = attributes.profile_image_url;
        console.log("ℹ️ User update received:", { id, name, profileImage });

        const existingUser = await User.findOne({ clerkId: id });

        if (!existingUser) {
          console.log(
            "⚠️ User update ignored - No existing user found in MongoDB."
          );
        } else {
          existingUser.name = name;
          existingUser.profileImage = profileImage;
          await existingUser.save();
          console.log("🔄 User updated in MongoDB:", existingUser);
        }
      }

      res.status(200).json({ success: true, message: "Webhook processed" });
    } catch (error) {
      console.error("Webhook Processing Error:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  }
);

// ✅ Normal JSON body parser for other API routes
app.use(express.json());

// ✅ Basic Route
app.get("/", (req, res) => {
  return res.status(200).json({ status: "ok" });
});

// ✅ User Routes
app.use(`/api/v1/users`, userRoutes);
app.use("/api/v1/board", boardsRoutes);

// ✅ MongoDB Setup
const port = process.env.PORT || 3127;
const dbUrl = process.env.DB_URI.replace("<password>", process.env.DB_PASS);

mongoose
  .connect(dbUrl)
  .then(() => {
    console.log("✅ Database connected successfully");

    // ✅ Start Server After DB Connects
    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: function (origin, callback) {
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error("Not allowed by CORS"));
          }
        },
        allowedHeaders: [
          "Access-Control-Allow-Origin",
          "Access-Control-Allow-Credentials",
          "Content-Type",
        ],
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    let canvasData = { pencil: [], lines: [], circles: [] };
    io.on("connection", (socket) => {
      console.log(`User connected: ${socket.id}`);

      // Store canvas data for each room separately
      const roomCanvasData = {};

      socket.on("join-room", async ({ currentRoom, clerkId }) => {
        console.log(`User ${clerkId} joined room: ${currentRoom}`);

        console.log(`User ${clerkId} joined room: ${currentRoom}`);

        socket.join(currentRoom);
        const board = await createBoard(currentRoom, clerkId);
        updateRooms(clerkId, currentRoom);

        // Initialize canvas data for the room if not exists
        console.log(board);

        // Send the existing canvas data for that room
        if (board) {
          const data = board;
          io.to("updateCanvas").emit("updateCanvas", data);
        }
      });

      socket.on("leave-room", (roomId) => {
        socket.leave(roomId);
        console.log(`User left room: ${roomId}`);
      });

      socket.on("updateCanvas", async ({ currentRoom, data }) => {
        console.log(`Updating canvas for room: ${currentRoom}`, data);

        const updatedBoard = await updateBoard(
          currentRoom,
          data.pencil,
          data.circles,
          data.lines,
          data.brush
        );
        console.log(updatedBoard);

        if (updatedBoard) {
          io.to(currentRoom).emit("updateCanvas", updatedBoard);
        }
      });
      socket.on("eraseLines", async ({ currentRoom, data }) => {
        console.log(`Erasing lines for room: ${currentRoom}`, data);

        const erasedLines = await eraseLines(currentRoom, data);
        console.log(erasedLines);

        if (erasedLines) {
          io.to(currentRoom).emit("eraseLines", erasedLines);
        }
      });
      socket.on("dragObjects", async ({ currentRoom, data }) => {
        console.log(`Dragging objects for room: ${currentRoom}`, data);

        const updatedBoard = await dragData(currentRoom, data);
        io.to(currentRoom).emit("dragObjects", data); // just the updated piece
      });
      socket.on("removeAllData", async (currentRoom) => {
        console.log(`Removing all data for room: ${currentRoom}`);
        const removeAll = await removeAllData(currentRoom);
        if (removeAll) {
          io.to(currentRoom).emit("removeAllData", removeAll);
        }
      });
      socket.on("sendMessage", ({ room, clerkId, name, messages }) => {
        console.log("Message received from:", name, "Message:", messages);

        // Broadcast to everyone except sender
        socket.broadcast.to(room).emit("receiveMessage", {
          clerkId,
          name,
          messages: [messages],
        });
      });

      socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
      });
    });

    server.listen(port, () => {
      console.log(`✅ Server running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("❌ Database connection error:", err);
    process.exit(1);
  });

// Handle Unhandled Promise Rejections
process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  console.log("Unhandled Rejection! Shutting down...");
  process.exit(1);
});
