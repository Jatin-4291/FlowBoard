import {
  Pencil,
  Circle,
  Eraser,
  Slash,
  Pen,
  StopCircle,
  Trash2,
  Brush,
  PaintBucket,
  Shapes,
  Search,
} from "lucide-react";
import socket from "../socket";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useState } from "react";
import { useCurrentRoomStore, useWhiteboardStore } from "../Context/create";
import ImageSearchComponent from "./ImageSearchComponent";
function SideBar() {
  const {
    activeTool,
    setActiveTool,
    setLineWidth,
    setLineColor,
    setFillColor,
  } = useWhiteboardStore();
  const { currentRoom } = useCurrentRoomStore();
  const [brushWidhth, setBrushWidth] = useState(10);
  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBrushWidth(parseInt(e.target.value, 10));
    setLineWidth(parseInt(e.target.value, 10));
  };
  const removeAllData = (e: React.MouseEvent, currentRoom: string | null) => {
    e.preventDefault();
    if (currentRoom) {
      console.log(currentRoom);

      socket.emit("removeAllData", currentRoom);
    }
  };
  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 flex flex-col items-center bg-gray-900 text-white p-3 rounded-xl shadow-lg space-y-4 w-14">
      <button
        onClick={() => setActiveTool(null)}
        className={`p-3 rounded-md transition hover:bg-gray-700 ${
          activeTool === null ? "bg-gray-700" : ""
        }`}
      >
        <StopCircle size={20} />
      </button>

      <button
        onClick={() => setActiveTool("picker")}
        className={`p-3 rounded-md transition hover:bg-gray-700 ${
          activeTool === "picker" ? "bg-gray-700" : ""
        }`}
      >
        <Pen size={20} />
      </button>

      <Popover>
        <PopoverTrigger className="p-3 rounded-md transition hover:bg-gray-700">
          <Pencil />
        </PopoverTrigger>

        <PopoverContent className="bg-gray-800 text-white px-3 py-2 shadow-xl rounded-xl w-40 overflow-visible">
          <TooltipProvider>
            <div className="flex flex-col items-start gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActiveTool("pencil")}
                    className={`p-2.5 w-full flex items-center gap-2 rounded-lg transition hover:bg-gray-700 ${
                      activeTool === "pencil"
                        ? "bg-gray-700 ring-2 ring-white"
                        : ""
                    }`}
                  >
                    <Pencil size={18} />
                    <span className="text-sm">Pencil</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="text-xs px-2 py-0.5 bg-gray-700 text-white rounded"
                >
                  Pencil Tool
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActiveTool("eraser")}
                    className={`p-2.5 w-full flex items-center gap-2 rounded-lg transition hover:bg-gray-700 ${
                      activeTool === "eraser"
                        ? "bg-gray-700 ring-2 ring-white"
                        : ""
                    }`}
                  >
                    <Eraser size={18} />
                    <span className="text-sm">Eraser</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="text-xs px-2 py-0.5 bg-gray-700 text-white rounded"
                >
                  Eraser Tool
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger className="p-3 rounded-md transition hover:bg-gray-700">
          <Shapes />
        </PopoverTrigger>

        <PopoverContent className="bg-gray-800 text-white px-3 py-2 shadow-xl rounded-xl w-40 overflow-visible">
          <TooltipProvider>
            <div className="flex flex-col items-start gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActiveTool("circle")}
                    className={`p-2.5 w-full flex items-center gap-2 rounded-lg transition hover:bg-gray-700 ${
                      activeTool === "circle"
                        ? "bg-gray-700 ring-2 ring-white"
                        : ""
                    }`}
                  >
                    <Circle size={18} />
                    <span className="text-sm">Circle</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="text-xs px-2 py-0.5 bg-gray-700 text-white rounded"
                >
                  Circle Tool
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActiveTool("line")}
                    className={`p-2.5 w-full flex items-center gap-2 rounded-lg transition hover:bg-gray-700 ${
                      activeTool === "line"
                        ? "bg-gray-700 ring-2 ring-white"
                        : ""
                    }`}
                  >
                    <Slash size={18} />
                    <span className="text-sm">Line</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="text-xs px-2 py-0.5 bg-gray-700 text-white rounded"
                >
                  Line Tool
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger
          onClick={() => setActiveTool("brush")}
          className={`p-3 rounded-md transition hover:bg-gray-700 ${
            activeTool === "brush" ? "bg-gray-700" : ""
          }`}
        >
          <Brush />
        </PopoverTrigger>

        <PopoverContent className="bg-gray-900 text-white p-4 rounded-lg shadow-lg w-64">
          <div className="flex flex-col space-y-4">
            <div>
              <p className="mb-1">Brush Size</p>
              <input
                type="range"
                min="1"
                max="100"
                value={brushWidhth}
                onChange={handleWidthChange}
                className="w-full"
              />
            </div>

            <div>
              <p className="mb-2">Brush Color</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  "#000000",
                  "#FF0000",
                  "#00FF00",
                  "#0000FF",
                  "#FFFF00",
                  "#FF00FF",
                  "#00FFFF",
                  "#888888",
                  "#FFFFFF",
                ].map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      setLineColor(color);
                    }}
                    style={{ backgroundColor: color }}
                    className="w-8 h-8 rounded-full border-2 border-white hover:scale-110 transition-transform"
                  />
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger
          onClick={() => setActiveTool("fillcolor")}
          className={`p-3 rounded-md transition hover:bg-gray-700 ${
            activeTool === "fillcolor" ? "bg-gray-700" : ""
          }`}
        >
          <PaintBucket />
        </PopoverTrigger>

        <PopoverContent className="bg-gray-900 text-white p-4 rounded-lg shadow-lg w-64">
          <div>
            <p className="mb-2">Fill Color</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                "#000000",
                "#FF0000",
                "#00FF00",
                "#0000FF",
                "#FFFF00",
                "#FF00FF",
                "#00FFFF",
                "#888888",
                "#FFFFFF",
              ].map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    setFillColor(color);
                  }}
                  style={{ backgroundColor: color }}
                  className="w-8 h-8 rounded-full border-2 border-white hover:scale-110 transition-transform"
                />
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger
          className={`p-3 rounded-md transition hover:bg-gray-700 ${
            activeTool === "fillcolor" ? "bg-gray-700" : ""
          }`}
        >
          <Search />
        </PopoverTrigger>

        <PopoverContent className="bg-gray-900 text-white p-4 rounded-lg shadow-lg w-64">
          <ImageSearchComponent />
        </PopoverContent>
      </Popover>

      <button
        onClick={(e) => removeAllData(e, currentRoom)}
        className={`p-3 rounded-md transition hover:bg-red-700 ${
          activeTool === "removeAll" ? "bg-gray-700" : ""
        }`}
      >
        <Trash2 size={20} />
      </button>
    </div>
  );
}

export default SideBar;
