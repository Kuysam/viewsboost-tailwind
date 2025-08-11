import IconButton from "@/components/IconButton";
import { announce } from "@/lib/a11y";

export default function CanvasToolbar() {
  return (
    <div
      role="toolbar"
      aria-label="Insert and arrange"
      className="flex items-center gap-2 p-2 rounded-2xl border bg-white/70 backdrop-blur"
    >
      {/* Insert group */}
      <div role="group" aria-label="Insert" className="flex items-center gap-1 pr-2 border-r">
        <IconButton label="Add text" kbd="T" onClick={()=>announce("Text tool activated")} />
        <IconButton label="Add image" kbd="🖼️" onClick={()=>announce("Open image picker")} />
        <IconButton label="Add shape" kbd="◻︎" onClick={()=>announce("Shape tool activated")} />
      </div>

      {/* Arrange group */}
      <div role="group" aria-label="Arrange" className="flex items-center gap-1 pl-2">
        <IconButton label="Bring forward" kbd="⬆︎" onClick={()=>announce("Layer brought forward")} />
        <IconButton label="Send backward" kbd="⬇︎" onClick={()=>announce("Layer sent backward")} />
        <IconButton label="Align left" kbd="⟸" onClick={()=>announce("Aligned left")} />
        <IconButton label="Align center" kbd="╳" onClick={()=>announce("Aligned center")} />
        <IconButton label="Align right" kbd="⟹" onClick={()=>announce("Aligned right")} />
      </div>
    </div>
  );
}
