"use client";

import { Plus } from "lucide-react";

export function AddTransactionButton() {
  const handleClick = () => {
    window.dispatchEvent(new Event("fab-add-transaction"));
  };

  return (
    <button
      onClick={handleClick}
      className="bg-primary text-primary-foreground font-medium text-xs px-3 py-1.5 rounded flex items-center gap-1.5 h-8"
    >
      <Plus className="size-3.5" strokeWidth={2.5} />
      <span>Add Transaction</span>
    </button>
  );
}