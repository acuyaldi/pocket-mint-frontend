import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const storybookMain = readFileSync(root + ".storybook/main.ts", "utf8");

describe("Storybook story discovery", () => {
  it("discovers stories under src/features/**, not just components/** and app/**", () => {
    expect(storybookMain).toContain("../src/features/**/*.stories.@(ts|tsx)");
  });
});
