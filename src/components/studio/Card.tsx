export function Card({
  thumb, label, onClick, w = 220, ar = '4/3'
}: { thumb: string; label?: string; onClick: () => void; w?: number; ar?: string }) {
  return (
    <button
      onClick={onClick}
      className="relative overflow-hidden rounded-md border border-white/10 bg-neutral-900"
      style={{ width: w, aspectRatio: ar as any }}
    >
      <img
        src={thumb}
        crossOrigin="anonymous"
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover object-center"
        alt=""
      />
      {label && (
        <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] text-white">
          {label}
        </span>
      )}
    </button>
  );
}


