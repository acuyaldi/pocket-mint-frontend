import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

if (!email || !password) {
  throw new Error("E2E_EMAIL dan E2E_PASSWORD wajib diisi.");
}

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:4000";
const authPath = "playwright/.auth/user.json";
const reviewDir = "playwright/reviews/phase-8-saving-goals";

await mkdir("playwright/.auth", { recursive: true });
await mkdir(`${reviewDir}/desktop`, { recursive: true });
await mkdir(`${reviewDir}/mobile`, { recursive: true });
await mkdir(`${reviewDir}/modals`, { recursive: true });

const browser = await chromium.launch({ channel: "msedge", headless: true });

// Login
const loginContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const loginPage = await loginContext.newPage();
await loginPage.goto(`${baseURL}/login`);
await loginPage.locator('input[name="email"]').fill(email);
await loginPage.locator('input[name="password"]').fill(password);
await loginPage.getByRole("button", { name: "Masuk", exact: true }).click();
await loginPage.waitForURL("**/dashboard", { timeout: 30_000 });
await loginContext.storageState({ path: authPath });
await loginContext.close();

async function hidePortal(page) {
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
}

// ---- Desktop ----
const desktop = await browser.newContext({ storageState: authPath, viewport: { width: 1440, height: 900 } });
const dpage = await desktop.newPage();

await dpage.goto(`${baseURL}/dashboard`);
await dpage.waitForLoadState("networkidle");
await hidePortal(dpage);
await dpage.screenshot({ path: `${reviewDir}/desktop/dashboard.png`, fullPage: true });
console.log("Captured: desktop/dashboard");

await dpage.goto(`${baseURL}/target-tabungan`);
await dpage.waitForLoadState("networkidle");
await dpage.getByRole("heading", { name: "Target Tabungan", exact: true }).waitFor({ state: "visible", timeout: 30_000 });
await hidePortal(dpage);
// KNOWN BLOCKER (see reports/review-summary.md): the `saving_goals` table
// does not exist in this dev DB, so GET /saving-goals 500s and the page
// always renders its error state — never a populated list. React Query
// retries for ~15s before giving up, so wait for the error text to settle.
await dpage.getByText("Gagal memuat target tabungan. Coba lagi.").waitFor({ state: "visible", timeout: 30_000 });
await dpage.screenshot({ path: `${reviewDir}/desktop/saving-goals-page.png`, fullPage: true });
console.log("Captured: desktop/saving-goals-page (error state — see blocker in review-summary.md)");

await dpage.screenshot({ path: `${reviewDir}/desktop/saving-goal-detail.png`, fullPage: true });
console.log("Captured: desktop/saving-goal-detail (no separate route; no goal ever renders due to the blocker)");

// ---- Modals (desktop viewport) ----
// Only the create modal can be reached: it opens from a static button, but
// submitting it 500s (same missing-table cause) so edit/update-progress/
// archive — which require an existing goal card — are unreachable.
await dpage.getByRole("button", { name: "Tambah Target" }).first().click();
await dpage.getByRole("dialog").waitFor({ state: "visible", timeout: 10_000 });
await dpage.waitForTimeout(300);
await dpage.screenshot({ path: `${reviewDir}/modals/create-saving-goal.png` });
console.log("Captured: modals/create-saving-goal");

await desktop.close();

// ---- Mobile ----
const mobile = await browser.newContext({ storageState: authPath, viewport: { width: 390, height: 844 } });
const mpage = await mobile.newPage();

await mpage.goto(`${baseURL}/dashboard`);
await mpage.waitForLoadState("networkidle");
await hidePortal(mpage);
await mpage.screenshot({ path: `${reviewDir}/mobile/dashboard.png`, fullPage: true });
console.log("Captured: mobile/dashboard");

await mpage.goto(`${baseURL}/target-tabungan`);
await mpage.waitForLoadState("networkidle");
await mpage.getByRole("heading", { name: "Target Tabungan", exact: true }).waitFor({ state: "visible", timeout: 30_000 });
await hidePortal(mpage);
await mpage.getByText("Gagal memuat target tabungan. Coba lagi.").waitFor({ state: "visible", timeout: 30_000 });
await mpage.screenshot({ path: `${reviewDir}/mobile/saving-goals-page.png`, fullPage: true });
console.log("Captured: mobile/saving-goals-page (error state — see blocker in review-summary.md)");

await mobile.close();
await browser.close();
