import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const frontendRoot = fileURLToPath(new URL("../", import.meta.url));
const logo = readFileSync(frontendRoot + "components/Logo.tsx", "utf8");
const approvedPath =
  "M5 1.75h12L13.75 5h-7A1.5 1.5 0 0 0 5.25 6.5v11.25a1.5 1.5 0 0 0 1.5 1.5h10.5a1.5 1.5 0 0 0 1.5-1.5V9l3.5-3.5V19A3.25 3.25 0 0 1 19 22.25H5A3.25 3.25 0 0 1 1.75 19V5A3.25 3.25 0 0 1 5 1.75Z";
const integrationFiles = [
  "components/ui/pocket-mint-hero.tsx",
  "app/page.tsx",
  "app/login/page.tsx",
  "app/auth/reset-password/page.tsx",
  "components/layout/app-sidebar.tsx",
];

describe("Pocket Mint logo system", () => {
  it("uses the approved Pocket Fold geometry and accessible live-text lockup", () => {
    expect(logo).toContain('viewBox="0 0 24 24"');
    expect(logo).toContain(approvedPath);
    expect(logo).toContain('fill="currentColor"');
    expect(logo).toContain('aria-label="Pocket Mint"');
    expect(logo).toContain("Pocket Mint");
    expect(logo).not.toContain("M6 10V28H26V10");
  });

  it("uses the shared lockup on every frontend brand surface", () => {
    for (const file of integrationFiles) {
      const source = readFileSync(frontendRoot + file, "utf8");
      expect(source, file).toContain("PocketMintLogo");
    }

    const sidebar = readFileSync(
      frontendRoot + "components/layout/app-sidebar.tsx",
      "utf8"
    );
    expect(sidebar).not.toContain("Private Financial Workspace");
  });

  it("installs the approved file-based app icon", () => {
    expect(existsSync(frontendRoot + "app/icon.svg")).toBe(true);
    expect(existsSync(frontendRoot + "app/favicon.ico")).toBe(false);
  });
});
