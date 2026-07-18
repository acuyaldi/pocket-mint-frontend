import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const profilePage = readFileSync(root + "app/(app)/profile/page.tsx", "utf8");

describe("Pocket Mint profile page contract", () => {
  // ── PM-STAB-005: Password change must call real Supabase endpoints ────

  it("calls Supabase signInWithPassword to verify current password", () => {
    expect(profilePage).toContain("supabase.auth.signInWithPassword");
  });

  it("calls Supabase updateUser to set new password", () => {
    expect(profilePage).toContain("supabase.auth.updateUser");
  });

  it("signs out after successful password change", () => {
    expect(profilePage).toContain("supabase.auth.signOut()");
  });

  it("redirects to login with success message after password change", () => {
    expect(profilePage).toContain(
      "Password berhasil diubah. Silakan login dengan password baru."
    );
  });

  it("does NOT contain the old fake setTimeout + success message", () => {
    expect(profilePage).not.toContain(
      "Form perubahan password sudah siap digunakan."
    );
    // The fake setTimeout delay pattern should be gone.
    expect(profilePage).not.toContain("setTimeout(resolve, 900)");
  });

  // ── Validation contract ────────────────────────────────────────────

  it("validates all fields are filled", () => {
    expect(profilePage).toContain(
      "Lengkapi semua field password terlebih dahulu."
    );
  });

  it("rejects password shorter than 8 characters", () => {
    expect(profilePage).toContain("Password baru minimal 8 karakter.");
  });

  it("rejects mismatched confirmation", () => {
    expect(profilePage).toContain("Konfirmasi password baru belum cocok.");
  });

  it("rejects new password equal to current password", () => {
    expect(profilePage).toContain(
      "Password baru tidak boleh sama dengan password saat ini."
    );
  });

  it("handles wrong current password with a generic safe message", () => {
    expect(profilePage).toContain("Password saat ini salah.");
    // Must not leak whether the account exists or other internal details.
    expect(profilePage).not.toContain("Invalid login credentials");
  });

  it("handles invalid session by prompting re-login", () => {
    expect(profilePage).toContain(
      "Session tidak valid. Silakan login kembali."
    );
  });

  // ── Autocomplete contract ───────────────────────────────────────────

  it("uses current-password autocomplete on the current password field", () => {
    expect(profilePage).toContain('"current-password"');
  });

  it("uses new-password autocomplete on the new password field", () => {
    // Both newPassword and confirmPassword fields should use new-password
    const matches = profilePage.match(/"new-password"/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(2);
  });

  // ── State management contract ───────────────────────────────────────

  it("has loading state that disables the submit button", () => {
    expect(profilePage).toContain("disabled={loading}");
  });

  it("clears form fields on success via setForm(initialState)", () => {
    expect(profilePage).toContain("setForm(initialState)");
  });

  it("does not store passwords in global state, localStorage, or query strings", () => {
    // Passwords must only live in the controlled component state.
    expect(profilePage).not.toContain("localStorage");
    expect(profilePage).not.toContain("sessionStorage");
    expect(profilePage).not.toContain("searchParams");
    expect(profilePage).not.toContain("useSearchParams");
  });

  // ── UI integrity contract ───────────────────────────────────────────

  it("preserves the profile layout with Account Identity card", () => {
    expect(profilePage).toContain("Account Identity");
  });

  it("shows Google Auth notice for Google-authenticated users", () => {
    expect(profilePage).toContain("you are logged in using Google");
    expect(profilePage).toContain(
      "Password cannot be changed because you are logged in using Google"
    );
  });

  it("uses the existing Card, Input, and Button components (no new UI primitives)", () => {
    expect(profilePage).toContain('from "@/components/ui/card"');
    expect(profilePage).toContain('from "@/components/ui/input"');
    expect(profilePage).toContain('from "@/components/ui/button"');
  });
});
