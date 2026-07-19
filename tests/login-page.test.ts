import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import enMessages from "@/messages/en.json";

const root = fileURLToPath(new URL("../", import.meta.url));
const loginPage = readFileSync(root + "app/login/page.tsx", "utf8");

describe("Pocket Mint authentication page contract", () => {
  it("preserves every authentication mode and action", () => {
    for (const value of [
      '"signin"',
      '"signup"',
      '"forgot"',
      "login(formData)",
      "signup(formData)",
      "signInWithGoogle()",
      "resetPasswordForEmail",
    ]) {
      expect(loginPage).toContain(value);
    }
  });

  it("opens signup mode from the registration deep link", () => {
    expect(loginPage).toContain('searchParams.get("mode") === "register"');
    expect(loginPage).toContain('? "signup" : "signin"');
  });

  it("preserves field and autocomplete contracts", () => {
    for (const name of ["name", "email", "password", "confirmPassword"]) {
      expect(loginPage).toContain(`name="${name}"`);
    }
    for (const autocomplete of [
      "name",
      "email",
      "new-password",
      "current-password",
    ]) {
      expect(loginPage).toContain(`"${autocomplete}"`);
    }
  });

  it("keeps accessible status and password controls", () => {
    expect(loginPage).toContain('role="alert"');
    expect(loginPage).toContain(
      'showPassword ? t("hidePassword") : t("showPassword")'
    );
    expect(loginPage).toContain("disabled={busy}");
    expect(loginPage).toContain('t("resetSentMessage")');
    expect(enMessages.auth.hidePassword).toBe("Hide password");
    expect(enMessages.auth.showPassword).toBe("Show password");
    expect(enMessages.auth.resetSentMessage).toBe(
      "Check your email inbox for the password reset link."
    );
  });

  it("uses a quiet split shell with the form first on mobile", () => {
    expect(loginPage).toContain('t("workspaceLabel")');
    expect(enMessages.auth.workspaceLabel).toBe("PRIVATE FINANCIAL WORKSPACE");
    expect(loginPage).toContain("order-2");
    expect(loginPage).toContain("order-1");
    expect(loginPage).not.toContain("surface-grid");
    expect(loginPage).not.toContain("radial-gradient");
    expect(loginPage).not.toContain("SECURE FINTECH WORKSPACE");
    expect(loginPage).not.toContain("ENCRYPTED ACCESS | PRIVACY-FIRST");
  });

  it("places pulse beams only behind the information panel", () => {
    expect(loginPage).toContain(
      'import { PulseBeams } from "@/components/ui/pulse-beams"'
    );
    expect(loginPage).toContain('<PulseBeams variant="panel"');
    expect(loginPage).toContain("isolate overflow-hidden");
    expect(loginPage).toContain("relative z-10");
  });

  it("contains no em dash in visible source copy", () => {
    expect(loginPage).not.toContain("—");
  });
});
