import Board from "../Models/boardModel.js";
import axios from "axios";
export const updateBoard = async (
  currentRoom,
  newPencil,
  newCircles,
  newLines,
  newBrush,
  newImage
) => {
  try {
    // Fetch the existing board
    const existingBoard = await Board.findOne({ roomId: currentRoom });
    console.log(newBrush);

    if (!existingBoard) {
      console.log(`⚠️ Board with roomId ${currentRoom} not found`);
      return null;
    }

    // Merge new data with existing data
    existingBoard.pencil.push(...newPencil);
    existingBoard.circles.push(...newCircles);
    existingBoard.lines.push(...newLines);
    existingBoard.brush.push(...newBrush);
    existingBoard.images.push(newImage);

    // Save the updated board
    await existingBoard.save();

    console.log(`✅ Canvas updated for room: ${currentRoom}`);

    return existingBoard;
  } catch (error) {
    console.error("❌ Error updating board:", error);
    return null;
  }
};

export const createBoard = async (currentRoom, clerkId) => {
  try {
    console.log(currentRoom);

    let board = await Board.findOne({ roomId: currentRoom });

    if (!board) {
      board = await Board.create({
        roomId: currentRoom,
        users: [clerkId], // Initialize with clerkId
      });
      console.log("✅ Board created:", board);
    } else {
      // Only add clerkId if it's not already in users
      if (!board.users.includes(clerkId)) {
        board = await Board.findOneAndUpdate(
          { roomId: currentRoom },
          { $addToSet: { users: clerkId } },
          { new: true, runValidators: true }
        );
      }
    }

    return board;
  } catch (error) {
    console.error("❌ Error creating board:", error);
    return null;
  }
};

export const eraseLines = async (currentRoom, data) => {
  const update = data.pencil
    ? { $set: { pencil: data.pencil } }
    : { $set: { brush: data.brush } };

  const updatedBoard = await Board.findOneAndUpdate(
    { roomId: currentRoom },
    update,
    { new: true, runValidators: true }
  );

  if (!updatedBoard) {
    console.log(`⚠️ Board with roomId ${currentRoom} not found`);
    return null;
  }

  console.log(`✅ Canvas updated for room: ${currentRoom}`);
  console.log(`✅ Canvas updated data: ${updatedBoard}`);
  return updatedBoard;
};

export const dragData = async (currentRoom, data) => {
  try {
    const update = {};

    if (data.type === "circle") {
      const key = `circles.${data.index}.points`;
      update[key] = data.points;
    } else if (data.type === "line") {
      const key = `lines.${data.index}.points`;
      update[key] = data.points;
    } else if (data.type === "image") {
      update[`images.${data.index}.x`] = data.points[0];
      update[`images.${data.index}.y`] = data.points[1];
    }

    const updatedBoard = await Board.findOneAndUpdate(
      { roomId: currentRoom },
      { $set: update },
      { new: true } // return the updated doc
    );

    if (!updatedBoard) {
      throw new Error("Board not found");
    }

    return updatedBoard;
  } catch (error) {
    console.error("Error updating drag data:", error.message);
    throw new Error("Error updating drag data");
  }
};

export const transformData = async (currentRoom, data) => {
  try {
    const update = {};
    if (data.type === "image") {
      const key = `images.${data.index}`;
      update[key] = { width: data.points.width, height: data.points.height };
    }

    const updatedBoard = await Board.findOneAndUpdate(
      { roomId: currentRoom },
      { $set: update },
      { new: true } // return the updated doc
    );

    if (!updatedBoard) {
      throw new Error("Board not found");
    }

    return updatedBoard;
  } catch (error) {
    console.error("Error updating drag data:", error.message);
    throw new Error("Error updating drag data");
  }
};

export const removeAllData = async (currentRoom) => {
  try {
    const updatedBoard = await Board.findOneAndUpdate(
      { roomId: currentRoom },
      {
        $set: {
          pencil: [],
          circles: [],
          lines: [],
          brush: [],
          images: [],
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedBoard) {
      console.log(`⚠️ Board with roomId ${currentRoom} not found`);
      return null;
    }

    console.log(`✅ Canvas updated for room: ${currentRoom}`);
    console.log(updatedBoard);

    return updatedBoard;
  } catch (error) {
    console.error("❌ Error updating board:", error);
    return null;
  }
};

export const getMessages = async (req, res) => {
  console.log("hello");

  try {
    const { currentRoom } = req.query;
    const board = await Board.findOne({ roomId: currentRoom });

    if (!board) {
      console.log(`⚠️ Board with roomId ${currentRoom} not found`);
      return res.status(404).json({ error: "Board not found" });
    }

    // Fetch user details from Clerk API
    const clerkSecretKey = process.env.CLERK_SECRET_KEY; // Store this securely
    const userRequests = board.users.map((clerkId) =>
      axios.get(`https://api.clerk.dev/v1/users/${clerkId}`, {
        headers: { Authorization: `Bearer ${clerkSecretKey}` },
      })
    );

    const responses = await Promise.all(userRequests);
    const userData = responses.map((res) => ({
      id: res.data.id,
      name: res.data.first_name, // Fetch user's name
      email: res.data.email_addresses[0]?.email_address, // Fetch user's email
      image: res.data.image_url, // Fetch profile image
    }));

    res.status(200).json({
      messages: board.messages,
      users: userData, // Send user data instead of Clerk IDs
    });
  } catch (error) {
    console.error("Error fetching room:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const sendMessage = async (req, res) => {
  try {
    const { message, currentRoom, clerkId } = req.body;
    console.log("message", message, currentRoom, clerkId);

    if (!currentRoom || !message || !clerkId) {
      return res
        .status(400)
        .json({ error: "roomId, clerkId, and message are required" });
    }

    // Fetch sender details from Clerk API
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    const clerkResponse = await axios.get(
      `https://api.clerk.dev/v1/users/${clerkId}`,
      {
        headers: { Authorization: `Bearer ${clerkSecretKey}` },
      }
    );

    const userData = {
      userId: clerkResponse.data.id,
      name: clerkResponse.data.first_name || "Unknown User",
      image: clerkResponse.data.image_url,
    };

    // Find the board (room)
    let board = await Board.findOne({ roomId: currentRoom });

    if (!board) {
      return res.status(404).json({ error: "Board not found" });
    }

    // Check if user already exists in messages array
    const userMessageIndex = board.messages.findIndex(
      (msg) => msg.userId === clerkId
    );

    if (userMessageIndex !== -1) {
      // User exists → Append new message to their messages array
      board.messages[userMessageIndex].messages.push(message);
    } else {
      // User doesn't exist → Add a new entry for them
      board.messages.push({ ...userData, messages: [message] });
    }

    await board.save(); // Save updated messages to DB

    res
      .status(200)
      .json({ success: true, message: "Message sent successfully" });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
