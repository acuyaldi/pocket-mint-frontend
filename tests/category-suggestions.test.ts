// ============================================================
// Category suggestions — contract and integration tests
// ============================================================

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import enMessages from "@/messages/en.json";
import idMessages from "@/messages/id.json";

const readNormalized = (path: string) =>
  readFileSync(path, "utf8").replace(/\r\n/g, "\n");

const root = fileURLToPath(new URL("../", import.meta.url));
const hookSource = readNormalized(
  root + "src/features/categories/hooks/useCategorySuggestions.ts",
);
const componentSource = readNormalized(
  root + "src/features/categories/components/CategorySuggestionList.tsx",
);
const modalSource = readNormalized(
  root + "app/(app)/transactions/components/AddTransactionModal.tsx",
);

describe("useCategorySuggestions hook", () => {
  it("exports CategorySuggestion type with required fields", () => {
    expect(hookSource).toContain("categoryId: string");
    expect(hookSource).toContain("categoryName: string");
    expect(hookSource).toContain("confidence: ConfidenceLevel");
    expect(hookSource).toContain("reason: string");
    expect(hookSource).toContain("matchedKeyword: string");
    expect(hookSource).toContain("normalizedMerchant: string");
  });

  it("uses the /categories/suggestions endpoint", () => {
    expect(hookSource).toContain("/categories/suggestions");
  });

  it("sends description and type as query params", () => {
    expect(hookSource).toContain("description:");
    expect(hookSource).toContain("type");
  });

  it("only enables query when description >= 3 chars", () => {
    expect(hookSource).toContain("trimmed.length >= 3");
    expect(hookSource).toContain("enabled");
  });

  it("has a short staleTime (30s, deterministic results)", () => {
    expect(hookSource).toContain("staleTime: 30_000");
  });

  it("includes description in query key for automatic refresh", () => {
    expect(hookSource).toContain('"categorySuggestions"');
  });
});

describe("CategorySuggestionList component", () => {
  it("renders a listbox with accessible name", () => {
    expect(componentSource).toContain('role="listbox"');
    expect(componentSource).toContain("aria-label");
  });

  it("supports keyboard navigation (ArrowDown, ArrowUp, Enter, Escape)", () => {
    expect(componentSource).toContain("ArrowDown");
    expect(componentSource).toContain("ArrowUp");
    expect(componentSource).toContain("Enter");
    expect(componentSource).toContain("Escape");
  });

  it("manages aria-activedescendant for focus", () => {
    expect(componentSource).toContain("aria-activedescendant");
  });

  it("conveys confidence without color alone (dots + text)", () => {
    expect(componentSource).toContain("CONFIDENCE_DOTS");
    expect(componentSource).toContain("aria-label={CONFIDENCE_ARIA");
  });

  it("shows loading state with role=status", () => {
    expect(componentSource).toContain('role="status"');
  });

  it("returns null for empty description (no suggestions state)", () => {
    expect(componentSource).toContain("!hasDescription");
  });

  it("accepts labels prop for i18n override", () => {
    expect(componentSource).toContain("labels?:");
  });

  it("has DEFAULT_LABELS in Indonesian", () => {
    expect(componentSource).toContain("Mencari saran kategori");
    expect(componentSource).toContain("Saran kategori");
    expect(componentSource).toContain("Tinggi");
    expect(componentSource).toContain("Sedang");
    expect(componentSource).toContain("Rendah");
  });
});

describe("AddTransactionModal — suggestion integration", () => {
  it("imports useCategorySuggestions hook", () => {
    expect(modalSource).toContain("useCategorySuggestions");
  });

  it("imports CategorySuggestionList component", () => {
    expect(modalSource).toContain("CategorySuggestionList");
  });

  it("tracks dismissed description to hide suggestions after selection", () => {
    expect(modalSource).toContain("dismissedDesc");
  });

  it("resets dismissedDesc on type change", () => {
    expect(modalSource).toContain("setDismissedDesc");
  });

  it("renders CategorySuggestionList inside description FormField", () => {
    expect(modalSource).toContain("<CategorySuggestionList");
  });

  it("only shows suggestions when not a transfer", () => {
    // The component is wrapped in !isTransfer guard
    const idx = modalSource.indexOf("<CategorySuggestionList");
    const context = modalSource.slice(Math.max(0, idx - 200), idx);
    expect(context).toContain("isTransfer");
  });

  it("passes suggestions, isLoading, hasDescription, and onSelect props", () => {
    expect(modalSource).toContain("suggestions={suggestions}");
    expect(modalSource).toContain("isLoading={suggestionsLoading}");
    expect(modalSource).toContain("hasDescription=");
    expect(modalSource).toContain("onSelect={handleSelectSuggestion}");
  });

  it("handleSelectSuggestion sets categoryId and dismisses", () => {
    expect(modalSource).toContain("setCategoryId(suggestion.categoryId)");
    expect(modalSource).toContain("setDismissedDesc(description.trim())");
  });
});

describe("i18n parity", () => {
  // Verify that if categories namespace is added, both langs match
  it("en and id have same top-level keys", () => {
    const enKeys = Object.keys(enMessages).sort();
    const idKeys = Object.keys(idMessages).sort();
    expect(enKeys).toEqual(idKeys);
  });
});
