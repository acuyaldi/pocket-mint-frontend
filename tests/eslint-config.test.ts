import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const eslintConfig = readFileSync(root + "eslint.config.mjs", "utf8");

describe("ESLint repository boundaries", () => {
  it("ignores generated files inside local worktrees", () => {
    expect(eslintConfig).toContain('".worktrees/**"');
  });
});
