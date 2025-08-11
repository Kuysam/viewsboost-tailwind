export default function SkeletonCard({ aspect = "aspect-[9/16]" }:{ aspect?: string }) {
  return (
    <div className={`${aspect} rounded-xl bg-slate-200/70 dark:bg-slate-700/40 animate-pulse`} />
  );
}
