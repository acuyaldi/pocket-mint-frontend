"use client";

import { Pencil, Store, Trash2 } from "lucide-react";
import type { MerchantMappingDto } from "@/src/types/merchantMapping";

export function MerchantMappingRow({
  mapping,
  categoryName,
  editLabel = "Ubah",
  deleteLabel = "Hapus",
  editAriaLabel,
  deleteAriaLabel,
  onEdit,
  onDelete,
}: {
  mapping: MerchantMappingDto;
  categoryName: string;
  editLabel?: string;
  deleteLabel?: string;
  editAriaLabel?: string;
  deleteAriaLabel?: string;
  onEdit: (mapping: MerchantMappingDto) => void;
  onDelete: (mapping: MerchantMappingDto) => void;
}) {
  return (
    <li className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-card p-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Store className="size-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{mapping.merchantName}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{categoryName}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => onEdit(mapping)}
          aria-label={editAriaLabel ?? `${editLabel} ${mapping.merchantName}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/70 px-3 text-xs font-semibold text-foreground transition-colors hover:bg-surface-high"
        >
          <Pencil className="size-3.5" /> {editLabel}
        </button>
        <button
          type="button"
          onClick={() => onDelete(mapping)}
          aria-label={deleteAriaLabel ?? `${deleteLabel} ${mapping.merchantName}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/70 px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-coral/10 hover:text-coral"
        >
          <Trash2 className="size-3.5" /> {deleteLabel}
        </button>
      </div>
    </li>
  );
}
