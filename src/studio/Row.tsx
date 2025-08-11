import { PropsWithChildren } from 'react';

export default function Row({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <section className="mb-8">
      <div className="mb-3 text-sm font-semibold text-white/80">{title}</div>
      <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
    </section>
  );
}


