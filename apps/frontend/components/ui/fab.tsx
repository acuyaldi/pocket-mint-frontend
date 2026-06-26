"use client";

import { Plus } from "lucide-react";

export function FAB() {
  const handleClick = () => {
    window.dispatchEvent(new Event("fab-add-transaction"));
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-8 right-8 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-xl bg-[#e5e2e1] text-[#131313]"
      aria-label="Add Transaction"
    >
      <Plus className="size-6" strokeWidth={2.5} />
    </button>
  );
}