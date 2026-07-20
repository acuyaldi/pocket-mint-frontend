"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

const SIZE_CLASS = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-xl",
  lg: "sm:max-w-2xl",
} as const;

export type AppModalSize = keyof typeof SIZE_CLASS;

interface AppModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  size?: AppModalSize;
  /** Blocks Escape, backdrop, and close-button dismissal while true. */
  isPending?: boolean;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  /** Use "alertdialog" for destructive/confirmation modals. */
  role?: "dialog" | "alertdialog";
  titleId?: string;
}

export function AppModal({
  open,
  onOpenChange,
  title,
  description,
  size = "md",
  isPending = false,
  icon,
  footer,
  children,
  className,
  role = "dialog",
}: AppModalProps) {
  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (!next && isPending) return;
      onOpenChange(next);
    },
    [isPending, onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={!isPending}
        role={role}
        className={cn(
          "flex max-h-[85vh] w-full flex-col gap-0 overflow-hidden rounded-xl border border-border/60 bg-card p-0 text-foreground shadow-xl",
          SIZE_CLASS[size],
          className,
        )}
      >
        <div className="flex items-start gap-3 border-b border-border/50 bg-surface-low px-6 py-4">
          {icon}
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-xl font-semibold text-foreground">
              {title}
            </DialogTitle>
            {description ? (
              <DialogDescription className="mt-1 text-sm text-muted-foreground">
                {description}
              </DialogDescription>
            ) : null}
          </div>
        </div>

        {children ? (
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
            {children}
          </div>
        ) : null}

        {footer ? (
          <div className="flex flex-col-reverse gap-3 border-t border-border/50 bg-surface-low px-6 py-4 sm:flex-row">
            {footer}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

interface ModalSubmitButtonProps extends React.ComponentProps<typeof Button> {
  isPending?: boolean;
  pendingLabel?: React.ReactNode;
}

/** Standard async primary/destructive action button for modal footers. */
export function ModalSubmitButton({
  isPending = false,
  pendingLabel,
  variant = "default",
  className,
  disabled,
  children,
  ...props
}: ModalSubmitButtonProps) {
  return (
    <Button
      type="submit"
      variant={variant}
      disabled={isPending || disabled}
      className={cn("h-11 flex-1 gap-2", className)}
      {...props}
    >
      {isPending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

/** Standard cancel button for modal footers — always first, disabled while pending. */
export function ModalCancelButton({
  isPending = false,
  className,
  ...props
}: React.ComponentProps<typeof Button> & { isPending?: boolean }) {
  return (
    <Button
      type="button"
      variant="outline"
      disabled={isPending}
      className={cn("h-11 flex-1 bg-card", className)}
      {...props}
    />
  );
}
