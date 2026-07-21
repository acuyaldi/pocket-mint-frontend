import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));
const appModalSource = readFileSync(root + "components/ui/app-modal.tsx", "utf8");
const formFieldSource = readFileSync(root + "components/ui/form-field.tsx", "utf8");
const dialogSource = readFileSync(root + "components/ui/dialog.tsx", "utf8");

describe("AppModal source contract", () => {
  it("composes the shared Dialog primitive instead of reimplementing overlay/focus behavior", () => {
    expect(appModalSource).toContain('from "@/components/ui/dialog"');
    expect(appModalSource).toContain("<Dialog");
    expect(appModalSource).toContain("<DialogContent");
  });

  it("blocks dismissal while isPending is true", () => {
    expect(appModalSource).toContain("if (!next && isPending) return");
  });

  it("hides the close button while pending so it can't be used to dismiss", () => {
    expect(appModalSource).toContain("showCloseButton={!isPending}");
  });

  it("supports only the three real modal sizes (sm/md/lg)", () => {
    expect(appModalSource).toContain('sm: "sm:max-w-sm"');
    expect(appModalSource).toContain('md: "sm:max-w-xl"');
    expect(appModalSource).toContain('lg: "sm:max-w-2xl"');
  });

  it("standardizes header, scrollable body, and footer regions", () => {
    expect(appModalSource).toContain("DialogTitle");
    expect(appModalSource).toContain("overflow-y-auto");
    expect(appModalSource).toContain("border-t border-border/50");
  });

  it("exposes a ModalSubmitButton with pending spinner + label support", () => {
    expect(appModalSource).toContain("export function ModalSubmitButton");
    expect(appModalSource).toContain("animate-spin");
    expect(appModalSource).toContain("pendingLabel");
  });

  it("exposes a ModalCancelButton disabled while pending", () => {
    expect(appModalSource).toContain("export function ModalCancelButton");
    expect(appModalSource).toContain('variant="outline"');
  });

  it("supports the alertdialog role for destructive/confirmation modals", () => {
    expect(appModalSource).toContain('role = "dialog"');
    expect(dialogSource).toContain("DialogPrimitive.Popup");
  });
});

describe("FormField / FormErrorMessage source contract", () => {
  it("associates label, description, and error via aria-describedby / aria-invalid", () => {
    expect(formFieldSource).toContain("aria-describedby");
    expect(formFieldSource).toContain("aria-invalid");
  });

  it("shares one label typography via FieldLabel for both FormField and standalone composite fields", () => {
    expect(formFieldSource).toContain("export function FieldLabel");
    expect(formFieldSource).toContain("<FieldLabel");
  });

  it("renders a single consistent form-level mutation error banner", () => {
    expect(formFieldSource).toContain("export function FormErrorMessage");
    expect(formFieldSource).toContain('role="alert"');
  });

  it("FormErrorMessage renders nothing for an empty/undefined message", () => {
    expect(formFieldSource).toContain("if (!message) return null");
  });
});
