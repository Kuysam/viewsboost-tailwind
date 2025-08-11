// components/Toolbar.tsx
export default function Toolbar() {
    return (
      <div role="toolbar" aria-label="Insert and arrange" className="flex gap-1">
        <div role="group" aria-label="Insert">
          <button aria-label="Add text" className="h-11 w-11 grid place-items-center rounded-xl hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 ring-offset-2 ring-indigo-500">T</button>
          <button aria-label="Add image" className="h-11 w-11 grid place-items-center rounded-xl hover:bg-slate-100 focus-visible:ring-2 ring-offset-2 ring-indigo-500">🖼️</button>
        </div>
        <div role="group" aria-label="Arrange">
          <button aria-label="Bring forward" className="h-11 w-11 grid place-items-center rounded-xl hover:bg-slate-100 focus-visible:ring-2 ring-offset-2 ring-indigo-500">⬆︎</button>
        </div>
      </div>
    );
  }
  