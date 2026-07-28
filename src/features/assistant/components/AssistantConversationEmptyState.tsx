import { Sparkles } from "lucide-react";

interface AssistantConversationEmptyStateProps {
  title: string;
  description: string;
  examplesLabel: string;
  examples: string[];
}

/**
 * Shown before any instruction has been sent in this conversation. A restrained
 * anchor (icon → title → short explanation → example inputs) that guides the
 * first message without dominating the viewport, keeping the composer just
 * below it in view. Examples are plain suggested input text, not hardcoded
 * financial behavior.
 */
export function AssistantConversationEmptyState({
  title,
  description,
  examplesLabel,
  examples,
}: AssistantConversationEmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-border/70 bg-muted/30 p-6">
      <div className="flex flex-col items-center text-center">
        <span
          aria-hidden="true"
          className="flex size-10 items-center justify-center rounded-full bg-accent text-accent-foreground"
        >
          <Sparkles className="size-5" />
        </span>
        <p className="mt-3 text-base font-semibold text-foreground">{title}</p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
      {examples.length > 0 ? (
        <div className="mx-auto mt-5 max-w-md">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{examplesLabel}</p>
          <ul className="mt-2 space-y-1.5">
            {examples.map((example) => (
              <li
                key={example}
                className="rounded-lg border border-border/60 bg-card px-3 py-2 text-sm text-muted-foreground"
              >
                {example}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
