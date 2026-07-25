interface AssistantConversationEmptyStateProps {
  title: string;
  description: string;
  examplesLabel: string;
  examples: string[];
}

/** Shown before any instruction has been sent in this conversation. Examples are plain suggested input text, not hardcoded financial behavior. */
export function AssistantConversationEmptyState({
  title,
  description,
  examplesLabel,
  examples,
}: AssistantConversationEmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-border/70 p-6 text-center">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {examples.length > 0 ? (
        <div className="mt-4 text-left">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{examplesLabel}</p>
          <ul className="mt-2 space-y-1">
            {examples.map((example) => (
              <li key={example} className="text-sm text-muted-foreground">
                {example}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
