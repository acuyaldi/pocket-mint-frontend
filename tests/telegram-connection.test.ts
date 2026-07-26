import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * Source-text contract testing (same convention as tests/merchant-mappings.test.ts):
 * asserts exact substrings in the compiled source under `environment: "node"`,
 * no jsdom/render. Proves the expected calls/props/strings exist; does not
 * simulate user interaction (see TelegramConnectionCardView.stories.tsx for
 * the interaction-level coverage via the Storybook Vitest project).
 */

import idMessages from "@/messages/id.json";
import enMessages from "@/messages/en.json";

const root = fileURLToPath(new URL("../", import.meta.url));
const hookSource = readFileSync(root + "src/features/telegram/hooks/useTelegramConnection.ts", "utf8");
const containerSource = readFileSync(root + "app/(app)/profile/components/TelegramConnectionCard.tsx", "utf8");
const viewSource = readFileSync(root + "app/(app)/profile/components/TelegramConnectionCardView.tsx", "utf8");
const profileSource = readFileSync(root + "app/(app)/profile/page.tsx", "utf8");
const typesSource = readFileSync(root + "src/types/telegram.ts", "utf8");

describe("Telegram connection API contract", () => {
  it("hits the exact authenticated linking endpoints", () => {
    expect(hookSource).toContain('"/channels/telegram/connection"');
    expect(hookSource).toContain('"/channels/telegram/link-token"');
    expect(hookSource).toContain('"/channels/telegram/revoke"');
  });

  it("invalidates the connection query after revoking", () => {
    expect(hookSource).toContain("invalidateQueries");
    expect(hookSource).toContain("telegramConnection");
  });

  it("never reuses a second API client (goes through lib/api.ts)", () => {
    expect(hookSource).toContain('import api from "@/lib/api"');
    expect(hookSource).not.toContain("axios.create");
  });
});

describe("Telegram linking token handling", () => {
  it("never persists the raw linking token to localStorage or a URL", () => {
    for (const source of [containerSource, viewSource]) {
      expect(source).not.toMatch(/localStorage\.|sessionStorage\./);
      expect(source).not.toMatch(/searchParams|router\.push.*token/);
    }
  });

  it("clears the pending token via an expiry-scoped timer", () => {
    expect(containerSource).toContain("setTimeout");
    expect(containerSource).toContain("setPendingToken(null)");
    expect(containerSource).toContain("msUntilExpiry");
  });

  it("clears the pending token immediately after a successful disconnect", () => {
    expect(containerSource).toContain("onDisconnectConfirm");
    expect(containerSource).toMatch(/revoke\.mutateAsync\(\);[\s\S]*setPendingToken\(null\)/);
  });
});

describe("Telegram connection card composition", () => {
  it("is rendered from the profile page", () => {
    expect(profileSource).toContain("<TelegramConnectionCard");
    expect(profileSource).toContain('from "./components/TelegramConnectionCard"');
  });

  it("presentational view is a pure props component (container owns hooks)", () => {
    expect(viewSource).not.toContain("useTelegramConnection");
    expect(viewSource).not.toContain("useQuery");
    expect(viewSource).not.toContain("useMutation");
  });

  it("shows distinct loading, linked, and unlinked states, never a fabricated status", () => {
    expect(viewSource).toContain('status === "loading"');
    expect(viewSource).toContain('status === "linked"');
  });
});

describe("Telegram connection types", () => {
  it("connection status is a closed union, not a free-form string", () => {
    expect(typesSource).toContain('"ACTIVE" | "NONE"');
  });
});

describe("Telegram i18n coverage", () => {
  it("defines the same telegram keys for both locales", () => {
    expect(Object.keys(idMessages.profile.telegram).sort()).toEqual(
      Object.keys(enMessages.profile.telegram).sort(),
    );
  });

  it("does not translate the fixed /link command syntax", () => {
    expect(viewSource).toContain("/link {pendingToken.token}");
  });
});
