import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const componentPath = root + "components/ui/pulse-beams.tsx";

describe("PulseBeams", () => {
  it("is decorative, deterministic, responsive, and reduced-motion aware", () => {
    expect(existsSync(componentPath)).toBe(true);
    const source = readFileSync(componentPath, "utf8");

    expect(source).toContain('aria-hidden="true"');
    expect(source).toContain("pointer-events-none");
    expect(source).toContain("preserveAspectRatio");
    expect(source).toContain("useReducedMotion");
    expect(source).not.toContain("Math.random");
  });

  it("provides hero and panel variants", () => {
    expect(existsSync(componentPath)).toBe(true);
    const source = readFileSync(componentPath, "utf8");

    expect(source).toContain('variant?: "hero" | "panel"');
    expect(source).toContain("heroBeams");
    expect(source).toContain("panelBeams");
  });

  it("keeps the complete portrait hero geometry visible", () => {
    const source = readFileSync(componentPath, "utf8");

    expect(source).toContain(
      'variant === "hero" ? "0 0 858 1180" : "0 0 858 434"'
    );
    expect(source).toContain(
      'variant === "hero" ? "xMidYMin meet" : "xMidYMid slice"'
    );
  });

  it("converges the upper hero beams toward the CTA from both sides", () => {
    const source = readFileSync(componentPath, "utf8");

    expect(source).toContain("reverse?: boolean");
    expect(source).toContain("M-28 136H128");
    expect(source).toContain("H366");
    expect(source).toContain("M886 164H730");
    expect(source).toContain("H492");
    expect(source.match(/reverse: true/g)).toHaveLength(5);
    expect(source).toMatch(
      /x1:\s*beam\.reverse\s*\?\s*\["135%", "55%", "-20%"\]/
    );
    expect(source).toMatch(
      /x2:\s*beam\.reverse\s*\?\s*\["105%", "25%", "-50%"\]/
    );
  });
});
