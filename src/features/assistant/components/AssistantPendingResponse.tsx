import { Loader2 } from "lucide-react";

interface AssistantPendingResponseProps {
  label: string;
}

/**
 * Real pending-mutation status only — no fake typing animation, no
 * simulated streaming, no animated ellipsis. Announced once via
 * `aria-live="polite"` on the region this is rendered inside.
 */
export function AssistantPendingResponse({ label }: AssistantPendingResponseProps) {
  return (
    <div role="status" className="flex items-center gap-2 self-start text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      {label}
    </div>
  );
}
