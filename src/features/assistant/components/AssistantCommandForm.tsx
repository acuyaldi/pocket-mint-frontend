"use client";

import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

export interface AssistantCommandFormLabels {
  label: string;
  placeholder: string;
  helper: string;
  submit: string;
  submitting: string;
}

interface AssistantCommandFormProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  error?: string | null;
  labels: AssistantCommandFormLabels;
  /** Present while a clarification/draft is unresolved — disables the composer and explains why instead of just going inert. */
  disabledReason?: string | null;
}

/** The conversation composer — submits one natural-language financial instruction at a time onto the active (or a new) conversation. */
export function AssistantCommandForm({
  value,
  onChange,
  onSubmit,
  isSubmitting,
  error,
  labels,
  disabledReason,
}: AssistantCommandFormProps) {
  const isDisabled = isSubmitting || Boolean(disabledReason);
  const canSubmit = value.trim().length > 0 && !isDisabled;

  return (
    <form
      className="max-w-xl space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) onSubmit();
      }}
    >
      <FormField
        label={labels.label}
        htmlFor="assistant-instruction"
        description={disabledReason ?? labels.helper}
        error={error ?? undefined}
      >
        <Input
          id="assistant-instruction"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={labels.placeholder}
          disabled={isDisabled}
          autoComplete="off"
        />
      </FormField>
      <Button type="submit" disabled={!canSubmit} className="h-11 gap-2 px-4">
        {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
        {isSubmitting ? labels.submitting : labels.submit}
      </Button>
    </form>
  );
}
