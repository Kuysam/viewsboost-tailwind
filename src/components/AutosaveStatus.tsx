import { useEffect, useRef, useState } from "react";
export default function AutosaveStatus({ dirty }: { dirty: boolean }) {
  const [label, setLabel] = useState("All changes saved");
  const lastSaved = useRef<Date | null>(null);
  useEffect(() => { if (dirty) setLabel("Saving…"); }, [dirty]);
  (window as any).__onSaved = () => {
    lastSaved.current = new Date();
    const time = lastSaved.current.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setLabel(\`All changes saved • \${time}\`);
  };
  return <div className="text-xs text-slate-500">{label}</div>;
}
