// ── Helpers ──────────────────────────────────────────────────────────────────

export function formatDate(dateStr: string, intlLocale = "en-US") {
  return new Intl.DateTimeFormat(intlLocale, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(dateStr));
}

export function formatRupiah(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
