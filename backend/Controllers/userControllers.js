import User from "../Models/userModels.js";
export const getRoom = async (req, res) => {
  try {
    const { clerkId } = req.query;

    if (!clerkId) {
      return res.status(400).json({ error: "clerkId is required" });
    }

    const user = await User.findOne({ clerkId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ roomId: user.roomId, rooms: user.rooms });
  } catch (error) {
    console.error("Error fetching room:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const updateRooms = async (clerkId, roomId) => {
  try {
    const user = await User.findOne({ clerkId }).select("rooms");

    if (user && !user.rooms.includes(roomId)) {
      await User.findOneAndUpdate(
        { clerkId },
        { $addToSet: { rooms: roomId } }, // Ensures uniqueness
        { new: true }
      );
    }
  } catch (error) {
    console.error("Error updating rooms:", error);
  }
};
