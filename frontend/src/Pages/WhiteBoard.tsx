import { useState, useRef, useEffect, use } from "react";
import { Stage, Layer, Line, Circle, Image, Transformer } from "react-konva";
import SideBar from "../Components/SideBar";
import {
  useCurrentRoomStore,
  useImagesState,
  useWhiteboardStore,
} from "../Context/create";
import { KonvaEventObject } from "konva/lib/Node";
import Konva from "konva";
import socket from "../socket";
import UserName from "../Components/UserName";
import { useUser } from "@clerk/clerk-react";
import axios from "axios";
import useImage from "use-image";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/Components/ui/hover-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/Components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/Components/ui/sheet";
import ChatBox from "../Components/ChatBox";
// Define types
type PencilData = { points: number[] };
type LineData = number[];
type CircleData = { points: number[]; color?: string };
type BrushData = { points: number[]; color: string; width: number };
type ImageData = {
  image: HTMLImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
};
type IncomingImagePayload = {
  src: string; // base64
  x: number;
  y: number;
  width: number;
  height: number;
};

function WhiteBoard() {
  const { activeTool, lineColor, lineWidth, fillColor } = useWhiteboardStore();
  const [pencil, setPencil] = useState<PencilData[]>([]);
  const [lines, setLines] = useState<LineData[]>([]);
  const [tempLine, setTempLine] = useState<LineData | null>(null);
  const [circle, setCircle] = useState<CircleData[]>([]);
  const [tempCircle, setTempCircle] = useState<LineData | null>(null);
  const [brush, setBrush] = useState<BrushData[]>([]);
  const stageRef = useRef<Konva.Stage>(null);
  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [RoomId, setRoomId] = useState("");
  const { currentRoom, setCurrentRoom } = useCurrentRoomStore();
  const [joinRoom, setJoinRoom] = useState("");
  const [erasing, setErasing] = useState(false);
  const { image } = useImagesState();
  const [newImage] = useImage(image);
  const [localImages, setLocalImages] = useState<ImageData[]>([]);
  const imageRefs = useRef<Konva.Image[]>([]);
  const trRef = useRef<Konva.Transformer>(null);

  const { user } = useUser();

  const clerkId = user?.id;

  const isDrawing = useRef(false);

  useEffect(() => {
    if (!image) return;
    socket.emit("updateCanvas", {
      currentRoom,
      data: {
        pencil: [],
        lines: [],
        circles: [],
        brush: [],
        image: { image, x: 50, y: 50, width: 100, height: 100 },
      },
    });
  }, [image, currentRoom]);

  useEffect(() => {
    if (!clerkId) return; // Ensure clerkId is available before making the request

    const getRoom = async () => {
      try {
        const response = await axios.get(
          "https://flowboard-1uw3.onrender.com/api/v1/users/get-room",
          {
            params: { clerkId },
          }
        );

        console.log("Room Data:", response.data);
        setRoomId(response.data.roomId);
        setCurrentRoom(response.data.roomId);
      } catch (error) {
        console.error("Error fetching room:", error);
      }
    };

    getRoom();
  }, [clerkId, setCurrentRoom]);

  // ✅ Logs AFTER RoomId and currentRoom updates
  useEffect(() => {
    console.log("Updated RoomId:", RoomId);
    console.log("Updated currentRoom:", currentRoom);
  }, [RoomId, currentRoom]);
  useEffect(() => {
    if (
      image &&
      newImage &&
      !localImages.some((img) => img.image.src === newImage.src)
    ) {
      const imageData: ImageData = {
        image: newImage,
        x: 50 + localImages.length * 20,
        y: 50 + localImages.length * 20,
        width: 100,
        height: 100,
      };
      setLocalImages((prev) => [...prev, imageData]);
    }
  }, [newImage, image, localImages]);
  // ✅ Ensures socket emits only when currentRoom is updated
  useEffect(() => {
    if (!currentRoom || !clerkId) return;
    if (!currentRoom) return;
    console.log("Joining Room:", currentRoom);
    socket.emit("join-room", { currentRoom, clerkId });
  }, [currentRoom, clerkId]);
  useEffect(() => {
    socket.on("loadCanvas", (data) => {
      console.log("Loading existing canvas:", data);
      setPencil(data.pencil || []);
      setLines(data.lines || []);
      setCircle(data.circles || []);
      setBrush(data.brush || []);
    });

    socket.on("updateCanvas", (data) => {
      console.log("Updating canvas failed");
      console.log("Received update:", data);

      setPencil(data.pencil || []);
      setLines(data.lines || []);
      setCircle(data.circles || []);
      setBrush(data.brush || []);
      if (data.images && Array.isArray(data.images)) {
        Promise.allSettled(
          data.images.map((img: IncomingImagePayload) =>
            loadImageFromBase64(img)
          )
        )
          .then((results) => {
            const imageDataArray: ImageData[] = results
              .map((res, index) => {
                console.log(res, index);

                if (res.status === "fulfilled") {
                  const baseData = validImages[index];
                  return {
                    image: res.value,
                    x: baseData.x,
                    y: baseData.y,
                    width: baseData.width,
                    height: baseData.height,
                  } as ImageData;
                }
                return null;
              })
              .filter((item): item is ImageData => item !== null);

            imageRefs.current = [];
            setLocalImages(imageDataArray);
          })
          .catch((error) => {
            console.error("Error loading images:", error);
          });
      }
    });
    socket.on("eraseLines", (data) => {
      console.log("Received erase lines:", data);
      setPencil(data.pencil || []);
      setBrush(data.brush || []);
    });
    socket.on("dragObjects", (data) => {
      console.log("Received drag objects:", data);

      if (data.type === "circle") {
        setCircle((prev) => {
          const updated = [...prev];
          updated[data.index].points = data.points;
          return updated;
        });
      }

      if (data.type === "lines") {
        setLines((prev) => {
          const updated = [...prev];
          updated[data.index] = data.points;
          return updated;
        });
      }
    });
    socket.on("removeAllData", (data) => {
      console.log("Received remove all data:", data);
      console.log(data);

      setPencil(data.pencil);
      setLines(data.lines);
      setCircle(data.circles);
      setBrush(data.brush);
    });
    return () => {
      socket.off("loadCanvas");
      socket.off("updateCanvas");
    };
  }, []);

  // 🛑 Eraser: Remove lines near the pointer

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinRoom.trim()) return; // Prevent empty room ID

    // Leave the current room
    socket.emit("leave-room", currentRoom);

    // Update state and join the new room
    setCurrentRoom(joinRoom);
    setJoinRoom(""); // Reset input field

    socket.emit("join-room", { currentRoom, clerkId });
  };
  // const handleShapeSelect = (type: "line" | "circle", index: number) => {
  //   console.log("hello");

  //   if (activeTool == "picker") {
  //     console.log("click");
  //     setSelectedShape({ type, index });
  //     console.log(selectedShape);
  //   }
  // };
  const loadImageFromBase64 = (
    data: IncomingImagePayload
  ): Promise<ImageData> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.src = data.src;
      img.onload = () => {
        resolve({
          image: img,
          x: data.x,
          y: data.y,
          width: data.width,
          height: data.height,
        });
      };
      img.onerror = (err) => reject(err);
    });
  };

  const handleDragEnd = (
    e: Konva.KonvaEventObject<DragEvent>,
    type: "line" | "circle" | "image",
    index: number
  ) => {
    const newPos = { x: e.target.x(), y: e.target.y() };

    if (type === "circle") {
      setCircle((prev) => {
        const prevCircle = prev[index];
        const [x1, y1, x2, y2] = prevCircle.points;
        const dx = x2 - x1;
        const dy = y2 - y1;

        const updated = [...prev];
        updated[index] = {
          ...prevCircle,
          points: [newPos.x, newPos.y, newPos.x + dx, newPos.y + dy],
        };
        socket.emit("dragObjects", {
          currentRoom,
          data: {
            type: "circle",
            index,
            points: updated[index].points,
          },
        });

        return updated;
      });
    }

    if (type === "line") {
      setLines((prev) => {
        const [x1, y1, x2, y2] = prev[index];
        const dx = x2 - x1;
        const dy = y2 - y1;

        const updated = [...prev];
        updated[index] = [newPos.x, newPos.y, newPos.x + dx, newPos.y + dy];
        socket.emit("dragObjects", {
          currentRoom,
          data: {
            type: "lines",
            index,
            points: updated[index],
          },
        });
        return updated;
      });
    }
  };

  const handleLineRemove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    const pointer = stage?.getRelativePointerPosition();
    if (!pointer) return;
    setPencil((prev = []) => {
      const updatedPencil = prev.filter(
        (stroke) =>
          !stroke.points.some(
            (point, index) =>
              index % 2 === 0 &&
              Math.abs(point - pointer.x) < 10 &&
              Math.abs(stroke.points[index + 1] - pointer.y) < 10
          )
      );

      socket.emit("eraseLines", {
        currentRoom,
        data: { pencil: updatedPencil },
      });

      return updatedPencil;
    });
    setBrush((prev = []) => {
      const updatedBrush = prev.filter(
        (stroke) =>
          !stroke.points.some(
            (point, index) =>
              index % 2 === 0 &&
              Math.abs(point - pointer.x) < 10 &&
              Math.abs(stroke.points[index + 1] - pointer.y) < 10
          )
      );

      socket.emit("eraseLines", {
        currentRoom,
        data: { brush: updatedBrush },
      });

      return updatedBrush;
    });
  };
  const handleFillColor = (
    e: Konva.KonvaEventObject<MouseEvent>,
    points: number[]
  ) => {
    e.cancelBubble = true;

    setCircle((prevCircles) => {
      const updated = prevCircles.map((cir) =>
        cir.points.every((p, idx) => p === points[idx])
          ? { ...cir, color: fillColor }
          : cir
      );
      socket.emit("updateCanvas", {
        currentRoom,
        data: {
          pencil: [],
          lines: [],
          circles: updated,
          brush: [],
        },
      });

      return updated;
    });
  };

  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const scaleBy = 1.1;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;

    // Calculate new stage position to maintain cursor sync
    const newPos = {
      x: pointer.x - (pointer.x - stage.x()) * (newScale / oldScale),
      y: pointer.y - (pointer.y - stage.y()) * (newScale / oldScale),
    };

    setStageScale(newScale);
    setStagePosition(newPos);
  };

  // Handle Panning
  // const handleDragMove = (e: KonvaEventObject<WheelEvent>) => {
  //   setStagePosition({ x: e.target.x(), y: e.target.y() });
  // };
  // 🖊️ Handle Mouse Down (Start Drawing)
  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const pos = e.target.getStage()?.getRelativePointerPosition();
    if (!pos) return;

    isDrawing.current = true;

    if (activeTool === "pencil") {
      setPencil((prev = []) => [...prev, { points: [pos.x, pos.y] }]);
    }

    if (activeTool === "line") {
      setTempLine([pos.x, pos.y, pos.x, pos.y]);
    }

    if (activeTool === "eraser") {
      setErasing(true);
    }

    if (activeTool === "circle") {
      setTempCircle([pos.x, pos.y, pos.x, pos.y]);
    }
    if (activeTool === "brush") {
      setBrush((prev = []) => [
        ...prev,
        { points: [pos.x, pos.y], color: lineColor, width: lineWidth },
      ]);
    }
  };

  // ✍️ Handle Mouse Move (Update Line)
  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawing.current) return;

    const pos = e.target.getStage()?.getRelativePointerPosition();
    if (!pos) return;

    if (activeTool === "pencil") {
      setPencil((prev = []) => {
        if (prev.length === 0) return prev;
        const updated = [...prev];
        updated[updated.length - 1] = {
          points: [...updated[updated.length - 1].points, pos.x, pos.y],
        };
        return updated;
      });
    }

    if (activeTool === "line" && tempLine) {
      setTempLine([tempLine[0], tempLine[1], pos.x, pos.y]);
    }

    if (activeTool === "circle" && tempCircle) {
      setTempCircle([tempCircle[0], tempCircle[1], pos.x, pos.y]);
    }
    if (activeTool === "brush") {
      setBrush((prev = []) => {
        if (prev.length === 0) return prev;
        const updated = [...prev];
        const last = updated[updated.length - 1];

        updated[updated.length - 1] = {
          ...last,
          points: [...last.points, pos.x, pos.y],
        };

        return updated;
      });
    }
    if (activeTool === "eraser" && erasing) {
      handleLineRemove(e);
    }
  };

  // 🛑 Handle Mouse Up (Stop Drawing)
  const handleMouseUp = () => {
    isDrawing.current = false;

    if (activeTool === "pencil" && pencil.length > 0) {
      socket.emit("updateCanvas", {
        currentRoom,
        data: {
          pencil: [pencil[pencil.length - 1]],
          lines: [],
          circles: [],
          brush: [],
        },
      });
    }

    if (activeTool === "line" && tempLine) {
      setLines((prev = []) => {
        const newLines = [...prev, tempLine];
        socket.emit("updateCanvas", {
          currentRoom,
          data: {
            pencil: [],
            lines: [tempLine],
            circles: [],
            brush: [],
          },
        });
        return newLines;
      });
      setTempLine(null);
    }

    if (activeTool === "circle" && tempCircle) {
      setCircle((prev = []) => {
        const newCircles = [...prev, { points: tempCircle }];
        socket.emit("updateCanvas", {
          currentRoom,
          data: {
            pencil: [],
            lines: [],
            circles: [{ points: tempCircle }],
            brush: [],
          },
        });
        return newCircles;
      });
      setTempCircle(null);
    }
    if (activeTool == "brush" && brush.length > 0) {
      socket.emit("updateCanvas", {
        currentRoom,
        data: {
          brush: [
            {
              points: brush[brush.length - 1].points,
              color: lineColor,
              width: lineWidth,
            },
          ],
          pencil: [],
          lines: [],
          circles: [],
        },
      });
    }
    if (activeTool === "eraser") {
      setErasing(false);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="flex items-center justify-center w-16 h-full">
        <SideBar />
      </div>
      <div className="absolute top-4 right-20 flex space-x-2 z-50">
        <Dialog>
          <DialogTrigger className="bg-blue-800 text-white px-4 py-2 mt-3 h-12 rounded-2xl hover:bg-blue-700 transition cursor-pointer">
            Join Room
          </DialogTrigger>
          <DialogContent className="bg-white border-b border-gray-200 p-6 rounded-lg">
            <DialogHeader>
              <DialogTitle>Enter Room Id to Join</DialogTitle>
              <DialogDescription>
                Join a room by entering the ID to draw along with your friends!
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 flex flex-col gap-3">
              <form onSubmit={handleJoinRoom}>
                <input
                  type="text"
                  value={joinRoom}
                  onChange={(e) => setJoinRoom(e.target.value)}
                  placeholder="Enter Room ID"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="bg-blue-800 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition">
                  Join
                </button>
              </form>
            </div>
          </DialogContent>
        </Dialog>
        <Sheet>
          <SheetTrigger className="bg-blue-800 text-white px-4 py-2 mt-3 h-12 rounded-2xl hover:bg-blue-700 transition cursor-pointer">
            Chat
          </SheetTrigger>
          <SheetContent className="bg-white border-b border-gray-200 p-6 rounded-lg">
            <SheetHeader>
              <SheetTitle>Chat with your friends</SheetTitle>
              <SheetDescription></SheetDescription>
              <div>
                <ChatBox currentRoom={currentRoom} clerkId={clerkId ?? ""} />
              </div>
            </SheetHeader>
          </SheetContent>
        </Sheet>

        <HoverCard>
          <HoverCardTrigger className="bg-blue-800 text-white px-4 py-2 mt-3 h-12 rounded-2xl hover:bg-blue-700 transition cursor-pointer">
            Share Link
          </HoverCardTrigger>
          <HoverCardContent className="bg-white shadow-lg p-4 rounded-lg border border-gray-200">
            Copy And Share <span className="font-semibold">{RoomId}</span>
          </HoverCardContent>
        </HoverCard>
      </div>

      <div className="absolute top-8 right-8 rounded-full z-50">
        <UserName />
      </div>

      {/* Canvas */}
      <div className="flex items-center justify-center w-full h-full">
        <Stage
          ref={stageRef}
          width={window.innerWidth - 80}
          height={window.innerHeight - 10}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          draggable={activeTool == null}
          scaleX={stageScale}
          scaleY={stageScale}
          x={stagePosition.x}
          y={stagePosition.y}
          onWheel={handleWheel}
          // style={{ cursor }}
        >
          <Layer>
            {/* Pencil strokes */}
            {pencil.map((line, i) => (
              <Line
                key={i}
                points={line.points}
                stroke="black"
                strokeWidth={2}
                lineCap="round"
              />
            ))}

            {/* Straight lines */}
            {lines.map((line, i) => (
              <Line
                key={i}
                points={line}
                stroke="black"
                strokeWidth={2}
                draggable={activeTool == "picker"}
                onDragEnd={(e) => handleDragEnd(e, "line", i)}
              />
            ))}
            {tempLine && (
              <Line points={tempLine} stroke="black" strokeWidth={2} />
            )}

            {/* Circles */}
            {circle
              .filter((cir) => cir && cir.points && cir.points.length >= 4)
              .map((cir, i) => {
                const [x, y] = cir.points;
                const radius = Math.hypot(cir.points[2] - x, cir.points[3] - y);

                return (
                  <Circle
                    key={i}
                    x={x}
                    y={y}
                    radius={radius}
                    fill={cir.color || "transparent"}
                    stroke="black"
                    strokeWidth={2}
                    draggable={activeTool == "picker"}
                    onClick={
                      fillColor !== ""
                        ? (e) => handleFillColor(e, cir.points)
                        : undefined
                    }
                    onDragEnd={(e) => handleDragEnd(e, "circle", i)}
                  />
                );
              })}

            {tempCircle && (
              <Circle
                x={tempCircle[0]}
                y={tempCircle[1]}
                radius={Math.hypot(
                  tempCircle[2] - tempCircle[0],
                  tempCircle[3] - tempCircle[1]
                )}
                stroke="black"
                strokeWidth={2}
                draggable={true}
              />
            )}
            {/* Brush strokes */}
            {brush.map((brush, i) => (
              <Line
                key={i}
                points={brush.points}
                stroke={brush.color}
                strokeWidth={brush.width}
                lineCap="round"
              />
            ))}
            {localImages.map((imageData, i) => (
              <Image
                key={i}
                ref={(node) => {
                  if (node) imageRefs.current[i] = node;
                }}
                image={imageData.image}
                x={imageData.x}
                y={imageData.y}
                width={imageData.width}
                height={imageData.height}
                draggable
                onClick={() => {
                  const node = imageRefs.current[i];
                  if (node && trRef.current) {
                    trRef.current.nodes([node]);
                    trRef.current.getLayer()?.batchDraw();
                  }
                }}
              />
            ))}
            <Transformer ref={trRef} />
          </Layer>
        </Stage>
      </div>
    </div>
  );
}

export default WhiteBoard;
