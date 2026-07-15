import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const page = readFileSync(root + "app/page.tsx", "utf8");

describe("Pocket Mint landing page contract", () => {
  it("keeps the approved section order", () => {
    const markers = [
      'id="privacy"',
      'id="wallet"',
      'id="transactions"',
      'id="installment"',
      'id="cta"',
    ];
    const positions = markers.map((marker) => page.indexOf(marker));

    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it("uses the Dashboard once as the hero visual", () => {
    expect(page.match(/\/landing\/dashboard\.png/g)).toHaveLength(1);
    expect(page).not.toContain('id="dashboard"');
    expect(page).not.toContain('id="product-pair"');
  });

  it("defines intentional editorial crops for each product story", () => {
    expect(page).toContain("data-crop={crop}");

    for (const crop of [
      "dashboard-overview",
      "wallet-summary-cards",
      "transaction-search-rows",
      "installment-summary-cards",
    ]) {
      expect(page).toContain(`crop="${crop}"`);
    }
  });

  it("uses the approved concise copy", () => {
    for (const copy of [
      "Clarity Over Complexity",
      "Data finansial Anda tetap milik Anda.",
      "Lihat posisi keuangan Anda dalam satu ringkasan.",
      "Semua aset dan kewajiban dalam satu ledger.",
      "Riwayat yang cepat dicari dan mudah diperbaiki.",
      "Pantau kewajiban tanpa kehilangan tanggal jatuh tempo.",
      "Mulai bangun ruang kerja finansial privat Anda.",
    ]) {
      expect(page).toContain(copy);
    }
  });

  it("does not contain startup-pitch content", () => {
    for (const forbidden of [
      "Trusted by",
      "10,000",
      "★★★★★",
      "Kenapa memilih Pocket Mint",
      "testimonial",
    ]) {
      expect(page).not.toContain(forbidden);
    }

    expect(page).not.toMatch(/[—–]/);
  });

  it("references four approved local Stitch assets", () => {
    for (const asset of [
      "dashboard.png",
      "wallet.png",
      "transaction.png",
      "installment.png",
    ]) {
      expect(existsSync(root + `public/landing/${asset}`)).toBe(true);
      expect(page).toContain(`/landing/${asset}`);
    }
  });
});
