"use client";

import * as React from "react";
import { ArrowUp, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** Auto-grow ceiling — past this a long instruction scrolls inside the box
 *  instead of pushing the send button off-screen. Matches the `max-h-50`
 *  utility on the textarea (12.5rem / 200px). */
const MAX_TEXTAREA_HEIGHT = 200;

export interface ChatPromptInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Fired on Enter (without Shift) or on the send button — only when there is
   *  trimmed content and the composer is neither disabled nor sending. */
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
  isSending?: boolean;
  /** Accessible name for the send button (idle vs. sending label). */
  sendLabel: string;
  /** Cloned in by `FormField` to wire the label association. */
  id?: string;
  /** Cloned in by `FormField` for validation state. */
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  className?: string;
}

/**
 * A calm, single-message chat composer: a card-surfaced, auto-growing textarea
 * with a bottom-right send button. Enter sends, Shift+Enter inserts a newline.
 *
 * Presentational and fully controlled — it holds no submission logic, owns no
 * conversation state, and never fabricates data. Styled with Pocket Mint
 * semantic tokens only (no raw colors), so it stays on-brand in light and dark.
 */
export function ChatPromptInput({
  value,
  onChange,
  onSend,
  placeholder,
  disabled = false,
  isSending = false,
  sendLabel,
  id,
  className,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedby,
}: ChatPromptInputProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, [value]);

  const canSend = value.trim().length > 0 && !disabled && !isSending;

  const send = () => {
    if (canSend) onSend();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends; Shift+Enter (and an in-progress IME composition) keeps the
    // native newline so multi-line instructions stay possible.
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send();
    }
  };

  return (
    <div
      className={cn(
        "flex cursor-text flex-col gap-2 rounded-xl border border-border bg-card p-2 shadow-sm transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        ariaInvalid && "border-destructive focus-within:border-destructive focus-within:ring-destructive/20",
        disabled && "opacity-60",
        className,
      )}
    >
      <textarea
        ref={textareaRef}
        id={id}
        rows={1}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedby}
        autoComplete="off"
        className="max-h-50 min-h-11 w-full resize-none bg-transparent px-2 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
      />
      <div className="flex items-center justify-end">
        <Button
          type="button"
          size="icon"
          onClick={send}
          disabled={!canSend}
          aria-label={sendLabel}
          className="size-11 rounded-full"
        >
          {isSending ? (
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          ) : (
            <ArrowUp className="size-5" aria-hidden="true" />
          )}
        </Button>
      </div>
    </div>
  );
}
