import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;            // aria-label
  kbd?: string;             // optional visual hint, e.g., "T" or "⌘K"
  active?: boolean;         // for toggle states
};

export default function IconButton({ label, kbd, active, className = "", ...rest }: Props) {
  const base = "h-11 w-11 grid place-items-center rounded-xl focus-visible:outline-none focus-visible:ring-2 ring-offset-2 ring-indigo-500";
  const hover = "hover:bg-slate-100";
  const activeCls = active ? "bg-indigo-50 ring-1 ring-indigo-200" : "";
  return (
    <button
      aria-label={label}
      aria-pressed={active || undefined}
      className={[base, hover, activeCls, className].filter(Boolean).join(" ")}
      {...rest}
    >
      <span className="pointer-events-none select-none">{kbd}</span>
    </button>
  );
}
