import { create } from "zustand";

interface WhiteboardState {
  activeTool:
    | "pencil"
    | "circle"
    | "eraser"
    | "line"
    | "picker"
    | "removeAll"
    | "brush"
    | "fillcolor"
    | null; // Keep null as a valid state for activeTool
  setActiveTool: (
    tool:
      | "pencil"
      | "circle"
      | "eraser"
      | "line"
      | "picker"
      | "removeAll"
      | "brush"
      | "fillcolor"
      | null // Allow null
  ) => void;

  lineWidth: number;
  setLineWidth: (width: number) => void;
  lineColor: string;
  setLineColor: (color: string) => void;
  fillColor: string;
  setFillColor: (color: string) => void;
}

export const useWhiteboardStore = create<WhiteboardState>((set) => ({
  activeTool: null,
  setActiveTool: (tool) => set({ activeTool: tool }), // Now accepts null
  lineWidth: 10,
  setLineWidth: (lineWidth) => set({ lineWidth }),
  lineColor: "black",
  setLineColor: (lineColor) => set({ lineColor }),
  fillColor: "",
  setFillColor: (fillColor) => set({ fillColor }),
}));

interface CurrentRoomState {
  currentRoom: string | "";
  setCurrentRoom: (room: string) => void;
}

export const useCurrentRoomStore = create<CurrentRoomState>((set) => ({
  currentRoom: "", // Initially, no room is active
  setCurrentRoom: (room) => set({ currentRoom: room }),
}));

interface ImagesState {
  image: string;
  setImage: (image: string) => void;
}

export const useImagesState = create<ImagesState>((set) => ({
  image: "",
  setImage: (image) => set({ image: image }),
}));
