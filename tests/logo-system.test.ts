import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const frontendRoot = fileURLToPath(new URL("../", import.meta.url));
const logo = readFileSync(frontendRoot + "components/Logo.tsx", "utf8");
const approvedPath =
  "M5 1.75h12L13.75 5h-7A1.5 1.5 0 0 0 5.25 6.5v11.25a1.5 1.5 0 0 0 1.5 1.5h10.5a1.5 1.5 0 0 0 1.5-1.5V9l3.5-3.5V19A3.25 3.25 0 0 1 19 22.25H5A3.25 3.25 0 0 1 1.75 19V5A3.25 3.25 0 0 1 5 1.75Z";

describe("Pocket Mint logo system", () => {
  it("uses the approved Pocket Fold geometry and accessible live-text lockup", () => {
    expect(logo).toContain('viewBox="0 0 24 24"');
    expect(logo).toContain(approvedPath);
    expect(logo).toContain('fill="currentColor"');
    expect(logo).toContain('aria-label="Pocket Mint"');
    expect(logo).toContain("Pocket Mint");
    expect(logo).not.toContain("M6 10V28H26V10");
  });
});
