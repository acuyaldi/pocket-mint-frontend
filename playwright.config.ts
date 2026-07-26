import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

try {
  process.loadEnvFile(path.resolve(__dirname, ".env"));
} catch {
  // .env is optional locally; CI injects env vars directly.
}

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:4000";

/**
 * Assistant E2E suite. Not a general-purpose E2E framework: scoped to the
 * Assistant conversation experience validated in Phase 23.7. See
 * `e2e/helpers/backend.ts` for why fixtures are seeded via the deterministic
 * `/assistant/execute` endpoint rather than the live-LLM `/assistant/messages`.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: "playwright/.auth/user.json" },
      dependencies: ["setup"],
    },
  ],
});
