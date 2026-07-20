"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";

/** Standalone label matching FormField's typography, for composite fields (pickers, button grids) that don't fit the label+single-control shape. */
export function FieldLabel({
  children,
  className,
  htmlFor,
}: {
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        "text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground",
        className,
      )}
    >
      {children}
    </label>
  );
}

interface FormFieldProps {
  label: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}

/** Standard label + control + helper/error wrapper used by every modal field. */
export function FormField({
  label,
  htmlFor,
  required,
  error,
  description,
  className,
  children,
}: FormFieldProps) {
  const descriptionId = htmlFor && description ? `${htmlFor}-description` : undefined;
  const errorId = htmlFor && error ? `${htmlFor}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  const child =
    React.isValidElement(children) && htmlFor
      ? React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
          id: htmlFor,
          "aria-invalid": error ? true : undefined,
          "aria-describedby": describedBy,
        })
      : children;

  return (
    <div className={cn("space-y-2", className)}>
      <FieldLabel htmlFor={htmlFor}>
        {label}
        {required ? <span className="ml-0.5 text-coral">*</span> : null}
      </FieldLabel>
      {child}
      {description ? (
        <p id={descriptionId} className="text-xs text-muted-foreground">
          {description}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs text-coral">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Standard form-level mutation error banner shown in a modal body/footer. */
export function FormErrorMessage({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-sm text-coral"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}
