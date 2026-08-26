/** The brand-soft chip counting how many facet values are selected. */
export function FilterCount({ count }: { count: number }) {
  return (
    <span className="rounded-xs bg-brand-soft px-1.75 py-0.25 type-caption font-bold text-brand-soft-text">
      {count}
    </span>
  );
}
