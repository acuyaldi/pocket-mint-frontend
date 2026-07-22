"use client";

import { ChevronDown, ChevronUp, Pencil, Trash2, Zap } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import type { RuleDto } from "@/src/types/rule";

export interface RuleRowLabels {
  edit: string;
  delete: string;
  editAria: string;
  deleteAria: string;
  enableAria: string;
  moveUpAria: string;
  moveDownAria: string;
  disabledBadge: string;
  conditionSummary: string;
}

export function RuleRow({
  rule,
  categoryName,
  labels,
  isFirst,
  isLast,
  onEdit,
  onDelete,
  onToggleEnabled,
  onMoveUp,
  onMoveDown,
}: {
  rule: RuleDto;
  categoryName: string;
  labels: RuleRowLabels;
  isFirst: boolean;
  isLast: boolean;
  onEdit: (rule: RuleDto) => void;
  onDelete: (rule: RuleDto) => void;
  onToggleEnabled: (rule: RuleDto, enabled: boolean) => void;
  onMoveUp: (rule: RuleDto) => void;
  onMoveDown: (rule: RuleDto) => void;
}) {
  return (
    <li
      className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-card p-4"
      aria-label={rule.enabled ? undefined : labels.disabledBadge}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex shrink-0 flex-col items-center gap-0.5">
          <button
            type="button"
            onClick={() => onMoveUp(rule)}
            disabled={isFirst}
            aria-label={labels.moveUpAria}
            className="inline-flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-surface-high disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronUp className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onMoveDown(rule)}
            disabled={isLast}
            aria-label={labels.moveDownAria}
            className="inline-flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-surface-high disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronDown className="size-4" />
          </button>
        </div>

        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Zap className="size-5 text-primary" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground">{rule.name}</p>
            {!rule.enabled && (
              <span className="shrink-0 rounded-full border border-border/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                {labels.disabledBadge}
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {labels.conditionSummary} → {categoryName}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Switch
          checked={rule.enabled}
          onCheckedChange={(checked) => onToggleEnabled(rule, checked)}
          aria-label={labels.enableAria}
        />
        <button
          type="button"
          onClick={() => onEdit(rule)}
          aria-label={labels.editAria}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/70 px-3 text-xs font-semibold text-foreground transition-colors hover:bg-surface-high"
        >
          <Pencil className="size-3.5" /> {labels.edit}
        </button>
        <button
          type="button"
          onClick={() => onDelete(rule)}
          aria-label={labels.deleteAria}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/70 px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-coral/10 hover:text-coral"
        >
          <Trash2 className="size-3.5" /> {labels.delete}
        </button>
      </div>
    </li>
  );
}
