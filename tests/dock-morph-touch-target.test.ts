import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));
const dockMorph = readFileSync(root + "components/ui/dock-morph.tsx", "utf8");

describe("DockMorph mobile touch target", () => {
  it("pads the mobile icon (size-8.5, 34px) enough to clear the 44px guideline", () => {
    // 34px icon + 6px padding per side (px-1.5/py-1.5) = 46px >= 44px.
    // A regression back to px-1/py-1 (4px/side) reintroduces the ~42px target.
    expect(dockMorph).toContain("size-8.5");
    expect(dockMorph).toMatch(/rounded-full px-1\.5 py-1\.5 text-\[13px\]/);
    expect(dockMorph).not.toMatch(/rounded-full px-1 py-1 text-\[13px\]/);
  });
});
