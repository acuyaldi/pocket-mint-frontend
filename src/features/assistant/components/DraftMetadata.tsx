export interface DraftMetadataItem {
  label: string;
  value: string;
}

interface DraftMetadataProps {
  items: DraftMetadataItem[];
}

/**
 * Generic label/value rows for reviewing structured Assistant data. Used by
 * the draft summary card today; kept generic (no draft-specific fields) so a
 * future clarification screen can reuse it for its own prompt/option data.
 */
export function DraftMetadata({ items }: DraftMetadataProps) {
  if (items.length === 0) return null;

  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">{item.label}</dt>
          <dd className="mt-0.5 text-sm font-medium text-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
