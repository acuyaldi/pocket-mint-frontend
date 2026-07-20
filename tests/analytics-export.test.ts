import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { filenameFromContentDisposition } from "@/src/features/transactions/hooks/useTransactions";
import { getExportFilename } from "@/app/(app)/analytics/period";

const root = fileURLToPath(new URL("../", import.meta.url));
const hooksSource = readFileSync(
  root + "src/features/transactions/hooks/useTransactions.ts",
  "utf8",
);
const analyticsSource = readFileSync(root + "app/(app)/analytics/page.tsx", "utf8");

describe("filenameFromContentDisposition", () => {
  it("reads a quoted filename", () => {
    expect(
      filenameFromContentDisposition('attachment; filename="transactions-month-2026-08.csv"', "fallback.csv"),
    ).toBe("transactions-month-2026-08.csv");
  });

  it("reads an unquoted filename", () => {
    expect(
      filenameFromContentDisposition("attachment; filename=transactions-month.csv", "fallback.csv"),
    ).toBe("transactions-month.csv");
  });

  it("falls back on a missing header", () => {
    expect(filenameFromContentDisposition(undefined, "fallback.csv")).toBe("fallback.csv");
  });

  it("falls back on a malformed header", () => {
    expect(filenameFromContentDisposition("attachment", "fallback.csv")).toBe("fallback.csv");
  });
});

describe("getExportFilename — deterministic download-fallback naming", () => {
  it("names a single-month period by its first and last calendar day", () => {
    expect(getExportFilename("month", "2026-08")).toBe("financial-report-2026-08-01_to_2026-08-31.csv");
  });

  it("names a quarter period spanning three months, oldest-to-newest", () => {
    expect(getExportFilename("quarter", "2026-08")).toBe("financial-report-2026-06-01_to_2026-08-31.csv");
  });

  it("names a six-month period", () => {
    expect(getExportFilename("six-months", "2026-08")).toBe("financial-report-2026-03-01_to_2026-08-31.csv");
  });

  it("handles a year rollover in the anchor month", () => {
    expect(getExportFilename("quarter", "2026-01")).toBe("financial-report-2025-11-01_to_2026-01-31.csv");
  });
});

describe("exportTransactionsCsv (PM-EXPORT) — download-flow contract", () => {
  it("requests the export endpoint as a blob with period + anchor params", () => {
    expect(hooksSource).toContain("'/transactions/export'");
    expect(hooksSource).toContain("responseType: 'blob'");
    expect(hooksSource).toContain("params: { period, anchor }");
  });

  it("resolves the filename from Content-Disposition with a deterministic fallback", () => {
    expect(hooksSource).toContain("filenameFromContentDisposition(");
    expect(hooksSource).toContain("response.headers['content-disposition']");
    expect(hooksSource).toContain("getExportFilename(period, anchor)");
  });

  it("attaches the download anchor to the DOM before clicking, and always removes it", () => {
    expect(hooksSource).toContain("document.body.appendChild(link)");
    expect(hooksSource).toContain("document.body.removeChild(link)");
    expect(hooksSource).toContain("link.click()");
  });

  it("revokes the object URL even if setup or the click throws", () => {
    const createIndex = hooksSource.indexOf("URL.createObjectURL(response.data)");
    const revokeIndex = hooksSource.indexOf("URL.revokeObjectURL(url)");
    expect(createIndex).toBeGreaterThan(-1);
    expect(revokeIndex).toBeGreaterThan(createIndex);
    // revokeObjectURL must sit in a `finally` that wraps the DOM/click work, not after it unconditionally.
    const betweenCreateAndRevoke = hooksSource.slice(createIndex, revokeIndex);
    expect(betweenCreateAndRevoke).toMatch(/finally\s*{\s*$/m);
  });
});

describe("Analytics export button — click and error handling", () => {
  it("guards against parallel downloads while a request is pending", () => {
    expect(analyticsSource).toContain("disabled={isExporting}");
    expect(analyticsSource).toContain("if (isExporting) return;");
  });

  it("shows the existing toast error feedback on failure, without a page reload", () => {
    expect(analyticsSource).toContain('toast(message ?? t("exportFailed"), "error")');
    expect(analyticsSource).not.toMatch(/location\.(href|reload)/);
    expect(analyticsSource).not.toContain("window.location");
  });

  it("always clears the pending state, success or failure", () => {
    const clickHandler = analyticsSource.slice(
      analyticsSource.indexOf("onClick={async () => {"),
      analyticsSource.indexOf("}}", analyticsSource.indexOf("onClick={async () => {")) + 2,
    );
    expect(clickHandler).toContain("finally {");
    expect(clickHandler).toContain("setIsExporting(false);");
  });
});
