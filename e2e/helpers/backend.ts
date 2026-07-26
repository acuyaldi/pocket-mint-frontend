import { createClient } from "@supabase/supabase-js";

/**
 * Direct backend/Supabase access for E2E test *setup* only (seeding fixtures
 * via the deterministic `/assistant/execute` endpoint, never through the
 * app's `lib/api.ts`). Real UI interaction still goes through the browser —
 * this only avoids depending on the non-deterministic `/assistant/messages`
 * (live Gemini) path to get a conversation into a known state.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001/api/v1";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var "${name}" for Assistant E2E tests.`);
  return value;
}

export async function getTestAccessToken(): Promise<string> {
  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  );
  const { data, error } = await supabase.auth.signInWithPassword({
    email: requireEnv("E2E_EMAIL"),
    password: requireEnv("E2E_PASSWORD"),
  });
  if (error || !data.session) {
    throw new Error(`E2E Supabase login failed: ${error?.message ?? "no session returned"}`);
  }
  return data.session.access_token;
}

async function api<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`${init.method ?? "GET"} ${path} -> ${res.status}: ${JSON.stringify(body)}`);
  }
  return body.data as T;
}

const E2E_WALLET_NAME = "E2E Assistant Wallet";

/** Reuses a wallet already owned by the E2E test user, or creates one. Never touches other wallets. */
export async function ensureTestWallet(token: string): Promise<{ id: string; name: string }> {
  const wallets = await api<Array<{ id: string; name: string }>>(token, "/wallets");
  const existing = wallets.find((w) => w.name === E2E_WALLET_NAME);
  if (existing) return existing;
  return api<{ id: string; name: string }>(token, "/wallets", {
    method: "POST",
    body: JSON.stringify({ name: E2E_WALLET_NAME, type: "CASH", balance: "1000000" }),
  });
}

export async function getExpenseCategory(token: string): Promise<{ id: string; name: string }> {
  const categories = await api<Array<{ id: string; name: string; type: string }>>(token, "/categories");
  const category = categories.find((c) => c.type === "EXPENSE");
  if (!category) throw new Error("E2E test user account has no EXPENSE category available.");
  return category;
}

interface AssistantExecuteResult {
  status: "success" | "clarification_required";
  conversationId: string;
  turnId: string;
  data?: unknown;
}

/**
 * Seeds a real Pending Financial Draft via `/assistant/execute` (no LLM
 * involved — deterministic tool/intent execution). Uses "Test Noodle Shop"
 * as fictional merchant data per phase test-data conventions.
 */
export async function seedAssistantDraft(
  token: string,
  opts: { walletName: string; categoryId: string; amount?: string; merchant?: string }
): Promise<AssistantExecuteResult> {
  return api<AssistantExecuteResult>(token, "/assistant/execute", {
    method: "POST",
    body: JSON.stringify({
      intent: "transaction.create",
      arguments: {
        type: "EXPENSE",
        amount: opts.amount ?? "20000",
        walletReference: opts.walletName,
        categoryId: opts.categoryId,
        merchantReference: opts.merchant ?? "Test Noodle Shop",
        date: new Date().toISOString().slice(0, 10),
      },
    }),
  });
}

/** Resolves a seeded draft so its conversation has no unresolved workflow left (used to set up clean history/switch fixtures). */
export async function cancelDraftViaApi(token: string, draftId: string): Promise<void> {
  await api(token, `/assistant/drafts/${draftId}/cancel`, { method: "POST" });
}

export function apiHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export { API_BASE_URL };
