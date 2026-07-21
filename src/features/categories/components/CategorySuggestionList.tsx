"use client";

import { useCallback, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import type { CategorySuggestion, ConfidenceLevel } from "../hooks/useCategorySuggestions";

// ============================================================
// Confidence badge — non-color cues for accessibility
// ============================================================

const CONFIDENCE_DOTS: Record<ConfidenceLevel, string> = {
  HIGH: "●●●",
  MEDIUM: "●●○",
  LOW: "●○○",
};

const CONFIDENCE_ARIA: Record<ConfidenceLevel, string> = {
  HIGH: "High confidence",
  MEDIUM: "Medium confidence",
  LOW: "Low confidence",
};

export interface CategorySuggestionLabels {
  loading: string;
  heading: string;
  listAria: string;
  high: string;
  medium: string;
  low: string;
}

const DEFAULT_LABELS: CategorySuggestionLabels = {
  loading: "Mencari saran kategori...",
  heading: "Saran kategori",
  listAria: "Category suggestions",
  high: "Tinggi",
  medium: "Sedang",
  low: "Rendah",
};

interface CategorySuggestionListProps {
  suggestions: CategorySuggestion[];
  isLoading: boolean;
  hasDescription: boolean;
  onSelect: (suggestion: CategorySuggestion) => void;
  labels?: Partial<CategorySuggestionLabels>;
}

/**
 * Renders ranked category suggestions with confidence indicators.
 *
 * Keyboard: Arrow keys navigate, Enter selects, Escape dismisses
 * (caller handles Escape dismissal via the parent).
 *
 * Accessibility:
 * - listbox/option roles
 * - aria-activedescendant for focus management
 * - Confidence conveyed via dots + text, never color alone
 */
export function CategorySuggestionList({
  suggestions,
  isLoading,
  hasDescription,
  onSelect,
  labels: partialLabels,
}: CategorySuggestionListProps) {
  const labels = { ...DEFAULT_LABELS, ...partialLabels };
  const listRef = useRef<HTMLUListElement>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [prevSuggestions, setPrevSuggestions] = useState(suggestions);
  const items = suggestions;

  // Reset active index when suggestions change (adjust state during
  // render instead of an effect, per https://react.dev/learn/you-might-not-need-an-effect)
  if (suggestions !== prevSuggestions) {
    setPrevSuggestions(suggestions);
    setActiveIndex(-1);
  }

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (items.length === 0) return;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setActiveIndex((prev) => (prev + 1) % items.length);
          break;
        case "ArrowUp":
          event.preventDefault();
          setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
          break;
        case "Enter":
          event.preventDefault();
          if (activeIndex >= 0 && activeIndex < items.length) {
            onSelect(items[activeIndex]);
          }
          break;
        case "Escape":
          event.preventDefault();
          break;
      }
    },
    [items, activeIndex, onSelect],
  );

  // Loading state
  if (isLoading) {
    return (
      <div
        className="mt-2 rounded-xl border border-border/60 bg-surface-low p-4"
        role="status"
        aria-label={labels.loading}
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="size-4 animate-pulse" />
          <span>{labels.loading}</span>
        </div>
      </div>
    );
  }

  if (!hasDescription || items.length === 0) {
    return null;
  }

  const activeId = activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined;

  return (
    <div className="mt-2 rounded-xl border border-border/60 bg-surface-low p-1">
      <div className="flex items-center gap-1.5 px-3 py-2">
        <Sparkles className="size-3.5 text-mint" />
        <span className="text-xs font-medium text-muted-foreground">
          {labels.heading}
        </span>
      </div>
      <ul
        ref={listRef}
        role="listbox"
        aria-label={labels.listAria}
        aria-activedescendant={activeId}
        onKeyDown={handleKeyDown}
        className="space-y-0.5"
      >
        {items.map((suggestion, index) => (
          <li
            key={suggestion.categoryId}
            id={`suggestion-${index}`}
            role="option"
            aria-selected={activeIndex === index}
            tabIndex={-1}
            onClick={() => onSelect(suggestion)}
            onMouseEnter={() => setActiveIndex(index)}
            className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors outline-none ${
              activeIndex === index
                ? "bg-mint/10 ring-1 ring-mint/30"
                : "hover:bg-surface-high"
            }`}
          >
            {/* Confidence dots — non-color indicator */}
            <span
              className="shrink-0 text-xs tracking-[0.15em] text-muted-foreground"
              aria-label={CONFIDENCE_ARIA[suggestion.confidence]}
              title={CONFIDENCE_ARIA[suggestion.confidence]}
            >
              {CONFIDENCE_DOTS[suggestion.confidence]}
            </span>

            {/* Category name + reason */}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-foreground">
                {suggestion.categoryName}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {suggestion.reason}
              </span>
            </span>

            {/* Confidence text badge */}
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.05em] ${
                suggestion.confidence === "HIGH"
                  ? "bg-mint/20 text-teal-700"
                  : suggestion.confidence === "MEDIUM"
                    ? "bg-amber/20 text-amber-700"
                    : "bg-surface-high text-muted-foreground"
              }`}
            >
              {suggestion.confidence === "HIGH"
                ? labels.high
                : suggestion.confidence === "MEDIUM"
                  ? labels.medium
                  : labels.low}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
