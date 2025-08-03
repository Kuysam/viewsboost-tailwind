import React, { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";

// Layer interface for the sidebar
interface LayerItem {
  id: string;
  type: string;
  label: string;
  visible: boolean;
}

const DEFAULT_CANVAS_WIDTH = 1420;
const DEFAULT_CANVAS_HEIGHT = 800;

export default function CanvasEditor({
  templateImage,
  onExport,
}: {
  templateImage?: string;
  onExport?: (dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [activeTab, setActiveTab] = useState<"upload" | "text" | "shapes" | "layers">("upload");
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);

  // Init Fabric canvas
  useEffect(() => {
    if (canvasRef.current && !canvas) {
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        width: DEFAULT_CANVAS_WIDTH,
        height: DEFAULT_CANVAS_HEIGHT,
        backgroundColor: "#fff",
        selection: true,
      });
      setCanvas(fabricCanvas);

      // Canvas events
      fabricCanvas.on("object:selected", (e) => {
        setSelectedObject(e.target || null);
      });
      fabricCanvas.on("selection:cleared", () => {
        setSelectedObject(null);
      });
      fabricCanvas.on("object:added", updateLayers);
      fabricCanvas.on("object:removed", updateLayers);
      fabricCanvas.on("object:modified", updateLayers);

      // Show template if provided
      if (templateImage) {
        fabric.Image.fromURL(templateImage, (img) => {
          fabricCanvas.add(img);
          fabricCanvas.setActiveObject(img);
          fabricCanvas.renderAll();
        });
      }
    }
    // eslint-disable-next-line
  }, [canvasRef, canvas, templateImage]);

  // Update layers
  const updateLayers = () => {
    if (!canvas) return;
    const objs = canvas.getObjects();
    setLayers(
      objs.map((obj, i) => ({
        id: obj.id || `obj${i}`,
        type: obj.type || "object",
        label: obj.type === "image" ? "Image" : obj.type === "video" ? "Video" : obj.type === "textbox" ? "Text" : obj.type,
        visible: obj.visible !== false,
      }))
    );
  };

  // -- UPLOAD HANDLERS --
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canvas || !e.target.files) return;
    const file = e.target.files[0];
    if (!file) return;

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        fabric.Image.fromURL(ev.target?.result as string, (img) => {
          canvas.add(img);
          img.center();
          canvas.setActiveObject(img);
          canvas.renderAll();
          updateLayers();
        });
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith("video/")) {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.src = url;
      video.crossOrigin = "anonymous";
      video.autoplay = false;
      video.loop = true;
      video.muted = true;
      video.width = 480;
      video.height = 320;

      video.onloadeddata = () => {
        const vidElem = new fabric.Image(video, {
          left: 100,
          top: 100,
          scaleX: 0.6,
          scaleY: 0.6,
          selectable: true,
        });
        (vidElem as any).type = "video";
        canvas.add(vidElem);
        canvas.setActiveObject(vidElem);
        canvas.renderAll();
        updateLayers();
      };
    }
    e.target.value = "";
  };

  // -- TEXT HANDLERS --
  const handleAddText = () => {
    if (!canvas) return;
    const textbox = new fabric.Textbox("Edit Me", {
      left: 250,
      top: 100,
      fill: "#18181b",
      fontSize: 36,
      fontFamily: "Inter, Arial, sans-serif",
      editable: true,
      fontWeight: "bold",
      backgroundColor: "#fff7e0",
    });
    canvas.add(textbox);
    canvas.setActiveObject(textbox);
    canvas.renderAll();
    updateLayers();
  };

  // -- SHAPE HANDLERS --
  const handleAddShape = (type: string) => {
    if (!canvas) return;
    let shape: fabric.Object;
    switch (type) {
      case "rect":
        shape = new fabric.Rect({ left: 200, top: 180, width: 120, height: 80, fill: "#facc15", rx: 18 });
        break;
      case "circle":
        shape = new fabric.Circle({ left: 350, top: 210, radius: 50, fill: "#0ea5e9" });
        break;
      case "line":
        shape = new fabric.Line([400, 400, 520, 420], { stroke: "#18181b", strokeWidth: 5 });
        break;
      default:
        return;
    }
    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.renderAll();
    updateLayers();
  };

  // -- DELETE SELECTED --
  const handleDelete = () => {
    if (canvas && selectedObject) {
      canvas.remove(selectedObject);
      setSelectedObject(null);
      canvas.renderAll();
      updateLayers();
    }
  };

  // -- LAYER TOGGLE/HIDE/SELECT --
  const handleSelectLayer = (index: number) => {
    if (!canvas) return;
    const obj = canvas.item(index);
    if (obj) {
      canvas.setActiveObject(obj);
      canvas.renderAll();
    }
  };
  const handleToggleLayer = (index: number) => {
    if (!canvas) return;
    const obj = canvas.item(index);
    if (obj) {
      obj.visible = !obj.visible;
      canvas.renderAll();
      updateLayers();
    }
  };

  // -- EXPORT IMAGE --
  const handleExport = () => {
    if (!canvas) return;
    const dataUrl = canvas.toDataURL({ format: "png" });
    if (onExport) onExport(dataUrl);
    else {
      const link = document.createElement("a");
      link.download = "viewsboost-design.png";
      link.href = dataUrl;
      link.click();
    }
  };

  // -- SIDEBAR & CONTROLS UI --
  return (
    <div className="flex w-full h-full bg-[#16171c] rounded-3xl shadow-2xl">
      {/* Sidebar */}
      <div className="w-64 min-w-[180px] h-full flex flex-col gap-6 p-5 bg-[#1a1b20] rounded-l-3xl">
        <div className="flex flex-col gap-2">
          <button className={`text-left px-4 py-3 rounded-xl font-bold transition ${activeTab === "upload" ? "bg-yellow-400 text-black" : "text-yellow-400 hover:bg-yellow-400/20"}`} onClick={() => setActiveTab("upload")}>📤 Upload</button>
          <button className={`text-left px-4 py-3 rounded-xl font-bold transition ${activeTab === "text" ? "bg-yellow-400 text-black" : "text-yellow-400 hover:bg-yellow-400/20"}`} onClick={() => setActiveTab("text")}>🔤 Text</button>
          <button className={`text-left px-4 py-3 rounded-xl font-bold transition ${activeTab === "shapes" ? "bg-yellow-400 text-black" : "text-yellow-400 hover:bg-yellow-400/20"}`} onClick={() => setActiveTab("shapes")}>🟦 Shapes</button>
          <button className={`text-left px-4 py-3 rounded-xl font-bold transition ${activeTab === "layers" ? "bg-yellow-400 text-black" : "text-yellow-400 hover:bg-yellow-400/20"}`} onClick={() => setActiveTab("layers")}>📋 Layers</button>
        </div>

        {/* Panels */}
        <div className="flex-1 mt-2 overflow-y-auto">
          {activeTab === "upload" && (
            <div>
              <label className="flex flex-col gap-2 cursor-pointer">
                <span className="font-medium mb-2 text-yellow-400">Add image or video</span>
                <input type="file" accept="image/*,video/*" onChange={handleUpload} className="hidden" />
                <div className="border border-dashed border-yellow-400 rounded-xl px-4 py-6 text-center hover:bg-yellow-400/10 transition">
                  <span className="text-yellow-400 text-lg">Click or drag to upload</span>
                </div>
              </label>
              {/* Drag-and-drop upload */}
              <div
                className="w-full h-24 border border-dashed border-yellow-400 rounded-lg mt-4 flex items-center justify-center text-yellow-400"
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault();
                  if (!canvas || !e.dataTransfer.files.length) return;
                  const file = e.dataTransfer.files[0];
                  handleUpload({ target: { files: [file] } } as any);
                }}
              >
                Drag file here
              </div>
            </div>
          )}

          {activeTab === "text" && (
            <div>
              <button onClick={handleAddText} className="block w-full mb-3 px-4 py-2 rounded-xl bg-yellow-400 text-black font-bold">Add Text</button>
              <div className="flex flex-col gap-2">
                {selectedObject && selectedObject.type === "textbox" && (
                  <div className="space-y-2 bg-[#262630] p-3 rounded-lg">
                    <input
                      type="text"
                      className="w-full p-2 rounded bg-white/10 text-yellow-400"
                      value={(selectedObject as fabric.Textbox).text || ""}
                      onChange={e => {
                        (selectedObject as fabric.Textbox).set("text", e.target.value);
                        canvas?.renderAll();
                      }}
                    />
                    <input
                      type="color"
                      className="w-full"
                      value={(selectedObject as fabric.Textbox).fill as string}
                      onChange={e => {
                        (selectedObject as fabric.Textbox).set("fill", e.target.value);
                        canvas?.renderAll();
                      }}
                    />
                    <input
                      type="range"
                      min={18}
                      max={96}
                      value={(selectedObject as fabric.Textbox).fontSize || 36}
                      onChange={e => {
                        (selectedObject as fabric.Textbox).set("fontSize", Number(e.target.value));
                        canvas?.renderAll();
                      }}
                    />
                    <button
                      onClick={handleDelete}
                      className="w-full py-2 mt-2 bg-red-500 text-white font-bold rounded-xl"
                    >
                      Delete Text
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "shapes" && (
            <div className="flex flex-col gap-2">
              <button className="w-full mb-2 px-4 py-2 rounded-xl bg-yellow-400 text-black font-bold" onClick={() => handleAddShape("rect")}>Add Rectangle</button>
              <button className="w-full mb-2 px-4 py-2 rounded-xl bg-yellow-400 text-black font-bold" onClick={() => handleAddShape("circle")}>Add Circle</button>
              <button className="w-full mb-2 px-4 py-2 rounded-xl bg-yellow-400 text-black font-bold" onClick={() => handleAddShape("line")}>Add Line</button>
              <button className="w-full py-2 mt-2 bg-red-500 text-white font-bold rounded-xl" onClick={handleDelete}>Delete Selected</button>
            </div>
          )}

          {activeTab === "layers" && (
            <div>
              <div className="text-yellow-400 mb-2 font-semibold">Layers</div>
              {layers.map((layer, idx) => (
                <div key={layer.id} className="flex items-center justify-between gap-2 mb-2 p-2 rounded-lg bg-[#222225] hover:bg-[#262630]">
                  <button onClick={() => handleSelectLayer(idx)} className="flex-1 text-left truncate">{layer.label} #{idx + 1}</button>
                  <button onClick={() => handleToggleLayer(idx)}>{layer.visible ? "👁️" : "🚫"}</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col h-full justify-center items-center bg-gradient-to-br from-[#18181c] to-[#232438] rounded-r-3xl p-6">
        {/* Toolbar */}
        <div className="flex gap-4 mb-4">
          <button className="px-4 py-2 rounded-xl bg-yellow-400 text-black font-bold" onClick={handleExport}>
            Export as PNG
          </button>
        </div>
        {/* Actual canvas */}
        <div className="rounded-3xl shadow-2xl overflow-hidden border-4 border-yellow-400">
          <canvas ref={canvasRef} width={DEFAULT_CANVAS_WIDTH} height={DEFAULT_CANVAS_HEIGHT} />
        </div>
      </div>
    </div>
  );
}
