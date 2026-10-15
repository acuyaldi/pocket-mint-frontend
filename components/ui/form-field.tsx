"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectTrigger } from "@/components/ui/select";

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
      id={htmlFor ? `${htmlFor}-label` : undefined}
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

  // Only clone onto an actual control, never a plain layout wrapper (e.g. the
  // relative-positioned `<div>` some amount fields use for a currency prefix)
  // — that would stamp `id`/aria props onto the div while the real input
  // keeps its own hardcoded id, producing two DOM elements with the same id
  // and silently breaking the label's `for` association.
  // ponytail: control detection is just "not a bare div"; a control nested
  // two levels deep inside a wrapper still won't get id/aria wired through —
  // upgrade by having such fields pass their id/aria props through explicitly
  // if that pattern shows up again.
  const isLayoutWrapper = React.isValidElement(children) && children.type === "div";
  const labelId = htmlFor ? `${htmlFor}-label` : undefined;
  const controlProps = {
    id: htmlFor,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
  };
  const child = (() => {
    if (!React.isValidElement(children) || !htmlFor || isLayoutWrapper) return children;
    // Select's accessible name lives on its nested SelectTrigger, not on the
    // Root — cloning straight onto <Select> would silently do nothing, which
    // is why callers used to hand-duplicate the id onto SelectTrigger too.
    // Its popup's `role="listbox"` is a separate element that Base UI never
    // labels either, so SelectContent gets `aria-labelledby` too.
    if (children.type === Select) {
      const rootProps = children.props as { children?: React.ReactNode };
      return React.cloneElement(children, {
        children: React.Children.map(rootProps.children, (grandchild) => {
          if (!React.isValidElement(grandchild)) return grandchild;
          if (grandchild.type === SelectTrigger) {
            return React.cloneElement(
              grandchild as React.ReactElement<Record<string, unknown>>,
              { ...controlProps, "aria-labelledby": labelId },
            );
          }
          if (grandchild.type === SelectContent) {
            return React.cloneElement(grandchild as React.ReactElement<Record<string, unknown>>, {
              "aria-labelledby": labelId,
            });
          }
          return grandchild;
        }),
      } as Record<string, unknown>);
    }
    return React.cloneElement(children as React.ReactElement<Record<string, unknown>>, controlProps);
  })();

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
        <p id={errorId} className="text-xs text-coral-strong">
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
      className="flex items-start gap-2 rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-sm text-coral-strong"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}
