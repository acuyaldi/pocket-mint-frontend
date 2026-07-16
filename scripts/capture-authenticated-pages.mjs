import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

if (!email || !password) {
  throw new Error("E2E_EMAIL dan E2E_PASSWORD wajib diisi.");
}

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:4000";
const authPath = "playwright/.auth/user.json";
const screenshotDir = "playwright/screenshots";

await mkdir("playwright/.auth", { recursive: true });
await mkdir(screenshotDir, { recursive: true });

const browser = await chromium.launch({
  channel: "msedge",
  headless: true,
});

// Login
const loginContext = await browser.newContext({
  viewport: { width: 1440, height: 900 },
});

const loginPage = await loginContext.newPage();

await loginPage.goto(`${baseURL}/login`);
await loginPage.locator('input[name="email"]').fill(email);
await loginPage.locator('input[name="password"]').fill(password);
await loginPage.getByRole("button", {
  name: "Sign In",
  exact: true,
}).click();

await loginPage.waitForURL("**/dashboard", {
  timeout: 30_000,
});

await loginContext.storageState({
  path: authPath,
});

await loginContext.close();

// Gunakan session yang sudah disimpan
const context = await browser.newContext({
  storageState: authPath,
  viewport: { width: 1440, height: 900 },
});

const page = await context.newPage();

const pages = [
  ["dashboard", "/dashboard", "Posisi keuangan bersih"],
  ["wallets", "/wallets", "Dompet"],
  ["transactions", "/transactions", "Transaksi"],
  ["tagihan", "/tagihan", "Tagihan"],
  ["analytics", "/analytics", "Analitik"],
];

for (const [name, route, readyText] of pages) {
  await page.goto(`${baseURL}${route}`);
  await page.waitForLoadState("networkidle");
  await page.waitForURL(`${baseURL}${route}`, { timeout: 30_000 });
  await page.getByText(readyText, { exact: true }).first().waitFor({
    state: "visible",
    timeout: 30_000,
  });

  if (new URL(page.url()).pathname !== route) {
    throw new Error(`${route} berakhir di ${page.url()}.`);
  }

  // Development-only Next.js/Turbopack controls must not pollute product captures.
  await page.addStyleTag({
    content: "nextjs-portal { display: none !important; }",
  });

  await page.screenshot({
    path: `${screenshotDir}/${name}.png`,
    fullPage: true,
  });

  console.log(`Captured: ${name}`);
}

await context.close();
await browser.close();
