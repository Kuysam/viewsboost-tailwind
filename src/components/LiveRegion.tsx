import { useEffect, useRef } from "react";
export default function LiveRegion() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onAnnounce = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (ref.current) ref.current.textContent = detail;
    };
    document.addEventListener("announce", onAnnounce as EventListener);
    return () => document.removeEventListener("announce", onAnnounce as EventListener);
  }, []);
  return <div ref={ref} aria-live="polite" className="sr-only" />;
}
