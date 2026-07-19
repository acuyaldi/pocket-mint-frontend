"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  CheckCircle2,
  Info,
  KeyRound,
  Loader2,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { mapAuthErrorKey } from "@/lib/auth/map-auth-error";

type FormState = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const initialState: FormState = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export default function ProfilePage() {
  const t = useTranslations("profile");
  const tRoot = useTranslations();
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ── Auth session — the login provider drives the conditional UI below ─────
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!active) return;
      setAuthUser(user);
      setAuthLoading(false);
      if (!user) router.replace("/login");
    });
    return () => {
      active = false;
    };
  }, [router]);

  // Supabase records the sign-in method in app_metadata.provider
  // ("email" for manual register, "google" for Google OAuth).
  const provider = authUser?.app_metadata?.provider ?? "email";
  const isGoogleUser = provider === "google";
  const accountName =
    (authUser?.user_metadata?.full_name as string | undefined) ??
    (authUser?.user_metadata?.name as string | undefined) ??
    "—";
  const accountEmail = authUser?.email ?? "—";

  const passwordStrength = useMemo(() => {
    if (form.newPassword.length >= 12) return t("changePassword.strength.strong");
    if (form.newPassword.length >= 8) return t("changePassword.strength.good");
    if (form.newPassword.length > 0) return t("changePassword.strength.weak");
    return t("changePassword.strength.pending");
  }, [form.newPassword, t]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    // ── Client-side validation ───────────────────────────────────
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setError(t("errors.fillAllFields"));
      return;
    }

    if (form.newPassword.length < 8) {
      setError(t("errors.passwordMinLength"));
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError(t("errors.passwordMismatch"));
      return;
    }

    if (form.newPassword === form.currentPassword) {
      setError(t("errors.samePassword"));
      return;
    }

    if (!authUser?.email) {
      setError(t("errors.invalidSession"));
      return;
    }

    setLoading(true);
    const supabase = createClient();

    // Verify current password by attempting sign-in.
    // Supabase updateUser only requires a valid session; explicit current-password
    // verification gives the user the feedback they expect and matches the spec.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: authUser.email,
      password: form.currentPassword,
    });

    if (signInError) {
      setLoading(false);
      setError(t("errors.wrongCurrentPassword"));
      return;
    }

    // Update to the new password on the freshly-authenticated session.
    const { error: updateError } = await supabase.auth.updateUser({
      password: form.newPassword,
    });

    if (updateError) {
      setLoading(false);
      setError(tRoot(`authErrors.${mapAuthErrorKey(updateError.message)}`));
      return;
    }

    // Invalidate the session — user must re-authenticate with the new password.
    await supabase.auth.signOut();
    setLoading(false);
    setForm(initialState);
    setSuccess(t("successChanged"));

    router.replace(
      `/login?message=${encodeURIComponent(t("successChangedRedirectMessage"))}`
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-8 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 font-mono text-[11px] tracking-[0.08em] text-primary">
            <ShieldCheck className="size-3.5" />
            {t("badge")}
          </div>
          <h1 className="font-heading text-3xl font-semibold text-foreground">
            {t("title")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <p className="font-mono text-[11px] tracking-[0.08em] text-muted-foreground">
            {t("loginMethod")}
          </p>
          <p className="mt-2 text-sm text-primary">
            {authLoading
              ? "…"
              : isGoogleUser
                ? t("loginMethodGoogle")
                : t("loginMethodEmail")}
          </p>
        </div>
      </div>

      {/* Account identity — readonly, shown for every login method */}
      <Card className="surface-card mb-6 max-w-2xl border border-white/80 py-0 shadow-none">
        <CardHeader className="border-b border-border px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-primary/20 bg-primary/10 p-2 text-primary">
              <UserRound className="size-4" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold text-foreground">
                {t("identity.title")}
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {isGoogleUser
                  ? t("identity.subtitleGoogle")
                  : t("identity.subtitleEmail")}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-6 py-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="accountEmail"
                className="text-sm font-medium text-foreground"
              >
                {t("identity.email")}
              </label>
              <Input
                id="accountEmail"
                readOnly
                aria-readonly="true"
                value={accountEmail}
                className="h-11 cursor-default border-border bg-muted px-3 text-foreground"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="accountName"
                className="text-sm font-medium text-foreground"
              >
                {isGoogleUser ? t("identity.nameGoogle") : t("identity.nameEmail")}
              </label>
              <Input
                id="accountName"
                readOnly
                aria-readonly="true"
                value={accountName}
                className="h-11 cursor-default border-border bg-muted px-3 text-foreground"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conditional password surface — form for email users, notice for Google */}
      {authLoading ? (
        <Card className="surface-card max-w-2xl border border-white/80 py-0 shadow-none">
          <CardContent className="flex items-center gap-2 px-6 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {t("loadingMethod")}
          </CardContent>
        </Card>
      ) : isGoogleUser ? (
        <Card className="surface-card max-w-2xl border border-warning/40 py-0 shadow-none">
          <CardHeader className="border-b border-warning/30 px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg border border-warning/30 bg-warning/10 p-2 text-warning">
                <Info className="size-4" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-foreground">
                  {t("changePassword.title")}
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("changePassword.subtitleGoogle")}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-6 py-6">
            <div className="flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-4">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-warning" />
              <p className="text-sm font-semibold text-foreground">
                {t("changePassword.googleNotice")}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="surface-card max-w-2xl border border-white/80 py-0 shadow-none">
          <CardHeader className="border-b border-border px-6 py-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg border border-primary/20 bg-primary/10 p-2 text-primary">
                <KeyRound className="size-4" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-foreground">
                  {t("changePassword.title")}
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("changePassword.subtitleEmail")}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-6 py-6">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-5">
                <div className="space-y-2">
                  <label
                    htmlFor="currentPassword"
                    className="text-sm font-medium text-foreground"
                  >
                    {t("changePassword.currentPassword")}
                  </label>
                  <Input
                    id="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    value={form.currentPassword}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        currentPassword: event.target.value,
                      }))
                    }
                    className="h-11 border-border bg-input px-3 text-foreground placeholder:text-muted-foreground"
                    placeholder={t("changePassword.currentPasswordPlaceholder")}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label
                      htmlFor="newPassword"
                      className="text-sm font-medium text-foreground"
                    >
                      {t("changePassword.newPassword")}
                    </label>
                    <span className="font-mono text-[11px] tracking-[0.08em] text-primary">
                      {passwordStrength}
                    </span>
                  </div>
                  <Input
                    id="newPassword"
                    type="password"
                    autoComplete="new-password"
                    value={form.newPassword}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        newPassword: event.target.value,
                      }))
                    }
                    className="h-11 border-border bg-input px-3 text-foreground placeholder:text-muted-foreground"
                    placeholder={t("changePassword.newPasswordPlaceholder")}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium text-foreground"
                  >
                    {t("changePassword.confirmNewPassword")}
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        confirmPassword: event.target.value,
                      }))
                    }
                    className="h-11 border-border bg-input px-3 text-foreground placeholder:text-muted-foreground"
                    placeholder={t("changePassword.confirmNewPasswordPlaceholder")}
                  />
                </div>
              </div>

              {error ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              {success ? (
                <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
                  <CheckCircle2 className="size-4" />
                  {success}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {t("changePassword.footerNote")}
                </p>
                <Button
                  type="submit"
                  size="lg"
                  disabled={loading}
                  className="h-11 min-w-48 justify-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      {t("changePassword.submitting")}
                    </>
                  ) : (
                    t("changePassword.submit")
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
