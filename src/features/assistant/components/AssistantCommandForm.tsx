"use client";

import { FormField } from "@/components/ui/form-field";
import { ChatPromptInput } from "@/components/ui/chat-prompt-input";

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
  /**
   * Inline field-validation error only (e.g. an over-length instruction). Global
   * request/provider/network failures are shown via the top snackbar, never
   * here — so this never fires for a server failure and the input is only marked
   * `aria-invalid` for genuine input validation.
   */
  error?: string | null;
  labels: AssistantCommandFormLabels;
  /** Present while a clarification/draft is unresolved — disables the composer and explains why instead of just going inert. */
  disabledReason?: string | null;
}

/**
 * The conversation composer — submits one natural-language financial instruction
 * at a time onto the active (or a new) conversation. The label/helper/error stay
 * on the shared `FormField` (which wires the textarea's id + validation state),
 * while the chat-style entry and send affordance live in `ChatPromptInput`.
 */
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
    <div className="w-full">
      <FormField
        label={labels.label}
        htmlFor="assistant-instruction"
        description={disabledReason ?? labels.helper}
        error={error ?? undefined}
      >
        <ChatPromptInput
          value={value}
          onChange={onChange}
          onSend={() => {
            if (canSubmit) onSubmit();
          }}
          placeholder={labels.placeholder}
          disabled={isDisabled}
          isSending={isSubmitting}
          sendLabel={isSubmitting ? labels.submitting : labels.submit}
        />
      </FormField>
    </div>
  );
}
