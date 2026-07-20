"use client";

import * as React from "react";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Shared application Select, built on Base UI so every field shares one styled,
 * portaled dropdown instead of native `<select>` rendering.
 *
 * ## Label display contract
 *
 * Base UI resolves the trigger label from the `items` prop on the Root, not from
 * `<SelectItem>` children. Without `items`, `<SelectValue>` falls back to
 * `String(value)` — rendering raw IDs.
 *
 * Pass `items` as a `Record<string, ReactNode>` mapping every possible value to
 * its human-readable label:
 *
 * ```tsx
 * <Select
 *   value={walletId}
 *   onValueChange={setWalletId}
 *   items={Object.fromEntries(wallets.map(w => [w.id, w.name]))}
 * >
 * ```
 *
 * For static options, use the same pattern:
 *
 * ```tsx
 * <Select
 *   value={institution}
 *   onValueChange={setInstitution}
 *   items={Object.fromEntries(INSTITUTIONS.map(i => [i.value, i.label]))}
 * >
 * ```
 */
function Select<Value, Multiple extends boolean | undefined = false>(
  props: SelectPrimitive.Root.Props<Value, Multiple>,
) {
  return <SelectPrimitive.Root {...props} />;
}
const SelectGroup = SelectPrimitive.Group;
const SelectGroupLabel = SelectPrimitive.GroupLabel;

function SelectTrigger({
  className,
  children,
  ...props
}: SelectPrimitive.Trigger.Props) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        "flex h-12 w-full items-center justify-between gap-2 rounded-xl border border-border/70 bg-card px-3 text-sm text-foreground outline-none transition-colors hover:bg-surface-low focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder]:text-muted-foreground aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon className="shrink-0 text-muted-foreground">
        <ChevronDown className="size-4" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn("min-w-0 flex-1 truncate text-left", className)}
      {...props}
    />
  );
}

function SelectContent({
  className,
  children,
  sideOffset = 6,
  align = "start",
  side = "bottom",
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<SelectPrimitive.Positioner.Props, "sideOffset" | "align" | "side">) {
  return (
    <SelectPrimitive.Portal>
      {/* z above the modal overlay (z-60), matching components/ui/dropdown-menu.tsx */}
      <SelectPrimitive.Positioner
        className="z-120 outline-none"
        sideOffset={sideOffset}
        align={align}
        side={side}
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          className={cn(
            "max-h-[min(24rem,var(--available-height))] w-[var(--anchor-width)] overflow-y-auto rounded-xl bg-popover p-1.5 text-sm text-popover-foreground ring-1 ring-foreground/10 shadow-[0_18px_36px_rgba(11,28,48,0.12)] outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className,
          )}
          {...props}
        >
          <SelectPrimitive.List>{children}</SelectPrimitive.List>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

function SelectItem({ className, children, ...props }: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "flex min-h-10 cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm outline-none select-none data-highlighted:bg-muted/70 data-disabled:cursor-default data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="text-mint">
        <Check className="size-4" aria-hidden="true" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

export {
  Select,
  SelectGroup,
  SelectGroupLabel,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
};
