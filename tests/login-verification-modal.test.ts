import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import enMessages from "@/messages/en.json";
import idMessages from "@/messages/id.json";

const root = fileURLToPath(new URL("../", import.meta.url));
const loginPage = readFileSync(root + "app/login/page.tsx", "utf8");

describe("Registration email-verification feedback", () => {
  it("opens the shared Dialog primitive from the signup result, not a new modal system", () => {
    expect(loginPage).toContain(
      'from "@/components/ui/dialog"'
    );
    expect(loginPage).toContain("result?.requiresVerification");
    expect(loginPage).toContain("setVerifyingEmail(result.email)");
    expect(loginPage).toContain("open={verifyingEmail !== null}");
  });

  it("does not treat an error result as the verification-success result", () => {
    expect(loginPage).toContain('"error" in result');
    expect(loginPage).toContain("mapAuthErrorKey(result.error)");
  });

  it("displays the submitted email inside the modal body", () => {
    expect(loginPage).toContain("{verifyingEmail}");
  });

  it("returns to login mode, preserves the email, and clears the password on the primary/close action", () => {
    expect(loginPage).toContain("function handleBackToLogin()");
    expect(loginPage).toContain('switchMode("signin")');
    expect(loginPage).toContain("setEmailValue(email)");
    expect(loginPage).toContain('passwordRef.current.value = ""');
    expect(loginPage).toContain("onOpenChange={(open) => {");
  });

  it("uses the localization system for every user-facing verification string", () => {
    for (const key of [
      "verifyEmail.title",
      "verifyEmail.body",
      "verifyEmail.explanation",
      "verifyEmail.backToLogin",
    ]) {
      expect(loginPage).toContain(`t("${key}")`);
    }

    expect(enMessages.auth.verifyEmail.title).toBe("Check your email");
    expect(idMessages.auth.verifyEmail.title).toBe("Periksa email kamu");
    expect(idMessages.auth.verifyEmail.body).toBe(
      "Kami telah mengirim tautan verifikasi ke:"
    );
    expect(idMessages.auth.verifyEmail.backToLogin).toBe("Kembali ke login");
  });
});
