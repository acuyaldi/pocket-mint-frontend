import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

// Runtime source that touches the API/auth boundary.
const runtimeFiles = [
  "lib/api.ts",
  "lib/api-errors.ts",
  "lib/auth/sync-user.ts",
  "lib/auth/session-token.ts",
  "app/actions/auth.ts",
  "app/auth/callback/route.ts",
];

// Legacy identity/auth artifacts that must not exist in runtime source anymore.
const forbidden = [
  "x-api-key",
  "x-user-id",
  "x-user-email",
  "kunci_rahasia",
  "supabaseId",
  "NEXT_PUBLIC_API_KEY",
  "process.env.API_KEY",
];

describe("no legacy auth artifacts in runtime source", () => {
  for (const rel of runtimeFiles) {
    it(`${rel} is free of legacy identity/auth artifacts`, () => {
      const src = readFileSync(root + rel, "utf8");
      for (const bad of forbidden) {
        expect(src.includes(bad), `${rel} still contains "${bad}"`).toBe(false);
      }
    });
  }
});
