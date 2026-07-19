import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import enMessages from "@/messages/en.json";
import idMessages from "@/messages/id.json";

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
    expect(profilePage).toContain('t("successChangedRedirectMessage")');
    expect(idMessages.profile.successChangedRedirectMessage).toBe(
      "Password berhasil diubah. Silakan masuk dengan password baru."
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
    expect(profilePage).toContain('t("errors.fillAllFields")');
    expect(idMessages.profile.errors.fillAllFields).toBe(
      "Lengkapi semua kolom password terlebih dahulu."
    );
  });

  it("rejects password shorter than 8 characters", () => {
    expect(profilePage).toContain('t("errors.passwordMinLength")');
    expect(idMessages.profile.errors.passwordMinLength).toBe(
      "Password baru minimal 8 karakter."
    );
  });

  it("rejects mismatched confirmation", () => {
    expect(profilePage).toContain('t("errors.passwordMismatch")');
    expect(idMessages.profile.errors.passwordMismatch).toBe(
      "Konfirmasi password baru belum cocok."
    );
  });

  it("rejects new password equal to current password", () => {
    expect(profilePage).toContain('t("errors.samePassword")');
    expect(idMessages.profile.errors.samePassword).toBe(
      "Password baru tidak boleh sama dengan password saat ini."
    );
  });

  it("handles wrong current password with a generic safe message", () => {
    expect(profilePage).toContain('t("errors.wrongCurrentPassword")');
    expect(idMessages.profile.errors.wrongCurrentPassword).toBe(
      "Password saat ini salah."
    );
    // Must not leak whether the account exists or other internal details.
    expect(profilePage).not.toContain("Invalid login credentials");
  });

  it("handles invalid session by prompting re-login", () => {
    expect(profilePage).toContain('t("errors.invalidSession")');
    expect(idMessages.profile.errors.invalidSession).toBe(
      "Sesi tidak valid. Silakan masuk kembali."
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
    expect(profilePage).toContain('t("identity.title")');
    expect(enMessages.profile.identity.title).toBe("Account Identity");
  });

  it("shows Google Auth notice for Google-authenticated users", () => {
    expect(profilePage).toContain('t("changePassword.googleNotice")');
    expect(enMessages.profile.changePassword.googleNotice).toBe(
      "Password can't be changed because you're signed in with a Google account."
    );
  });

  it("uses the existing Card, Input, and Button components (no new UI primitives)", () => {
    expect(profilePage).toContain('from "@/components/ui/card"');
    expect(profilePage).toContain('from "@/components/ui/input"');
    expect(profilePage).toContain('from "@/components/ui/button"');
  });
});
