import SkeletonCard from "@/components/SkeletonCard";

export type TemplateItem = {
  id: string;
  thumb: string;
  name: string;
};

export default function TemplateGrid({
  items,
  loading,
  onSelect,
  cols = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
}: {
  items: TemplateItem[];
  loading: boolean;
  onSelect?: (t: TemplateItem) => void;
  cols?: string;
}) {
  const Grid = ({ children }: { children: React.ReactNode }) => (
    <div className={`grid ${cols} gap-3`}>{children}</div>
  );

  if (loading) {
    return (
      <Grid>
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </Grid>
    );
  }

  return (
    <Grid>
      {items.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelect?.(t)}
          className="group relative aspect-[9/16] rounded-xl overflow-hidden border hover:shadow focus-visible:outline-none focus-visible:ring-2 ring-offset-2 ring-indigo-500 text-left"
        >
          <img
            src={t.thumb}
            alt={t.name}
            loading="lazy"
            decoding="async"
            fetchpriority="low"
            className="h-full w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 p-2 text-[11px] bg-gradient-to-t from-black/60 to-transparent text-white opacity-0 group-hover:opacity-100 transition">
            {t.name}
          </div>
        </button>
      ))}
    </Grid>
  );
}
