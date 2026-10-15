"use client";

import type { FormEvent, RefObject } from "react";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GuidedClarification } from "@/src/types/assistant";

export interface GuidedClarificationCardLabels {
  field: {
    category: string;
    date: string;
  };
  submit: string;
  cancel: string;
}

interface GuidedClarificationCardProps {
  clarification: GuidedClarification;
  prompt: string;
  labels: GuidedClarificationCardLabels;
  isSubmitting: boolean;
  isCancelling: boolean;
  onSubmit: (fields: Record<string, string>) => void;
  onCancel: () => void;
  headingRef?: RefObject<HTMLElement | null>;
}

export function GuidedClarificationCard({
  clarification,
  prompt,
  labels,
  isSubmitting,
  isCancelling,
  onSubmit,
  onCancel,
  headingRef,
}: GuidedClarificationCardProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const disabled = isSubmitting || isCancelling;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(values);
  }

  return (
    <article className="max-w-xl rounded-xl border border-border/70 bg-card p-6 shadow-sm">
      <h2
        ref={headingRef as RefObject<HTMLHeadingElement> | undefined}
        tabIndex={-1}
        className="text-base font-semibold text-foreground outline-none"
      >
        {prompt}
      </h2>
      <form onSubmit={submit} className="mt-4 space-y-4">
        {clarification.fields.map((field) => (
          <label key={field.field} className="block text-sm font-medium text-foreground">
            <span>{labels.field[field.field]}</span>
            <input
              className="mt-1 h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              type={field.input.type === "date" ? "date" : "text"}
              required={field.required}
              min={field.input.type === "date" ? field.input.min : undefined}
              max={field.input.type === "date" ? field.input.max : undefined}
              placeholder={field.input.type === "text" ? field.input.placeholder : undefined}
              value={values[field.field] ?? ""}
              onChange={(event) => setValues((current) => ({ ...current, [field.field]: event.target.value }))}
              disabled={disabled}
            />
          </label>
        ))}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={disabled} className="h-11 gap-2 px-4">
            {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            {labels.submit}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={disabled} className="h-11 gap-2 px-4">
            {isCancelling ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            {labels.cancel}
          </Button>
        </div>
      </form>
    </article>
  );
}
