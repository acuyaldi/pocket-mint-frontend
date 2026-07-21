"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Eye, EyeOff, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { mapAuthErrorKey } from "@/lib/auth/map-auth-error";
import { PocketMintLogo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Landing page for the password-reset email link. Supabase's browser client
 * (PKCE, `detectSessionInUrl`) exchanges the recovery code in the URL for a
 * short-lived session on mount, which authorizes the `updateUser` call below.
 * After a successful update we sign the recovery session out and bounce the
 * user back to /login so they re-authenticate with the new password.
 */
export default function ResetPasswordPage() {
  const t = useTranslations("auth.resetPassword");
  const tAuth = useTranslations("auth");
  const tRoot = useTranslations();
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Tracks whether a valid recovery session was detected from the URL.
  const [sessionReady, setSessionReady] = useState(false);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    // The recovery code is exchanged asynchronously; both the immediate
    // session check and the PASSWORD_RECOVERY event cover the timing.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session) {
        setSessionReady(true);
        setVerifying(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      if (session) setSessionReady(true);
      setVerifying(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    // Same lightweight validation convention used across the auth pages:
    // valid input is a password of at least 8 characters that matches confirm.
    if (newPassword.length < 8) {
      setError(tAuth("errors.passwordMinLength"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(tAuth("errors.passwordMismatch"));
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError(tRoot(`authErrors.${mapAuthErrorKey(updateError.message)}`));
      setLoading(false);
      return;
    }

    // Force a clean re-login with the new credentials.
    await supabase.auth.signOut();
    router.replace(
      `/login?message=${encodeURIComponent(t("successRedirect"))}`
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8 text-foreground">
      <div className="flex w-full max-w-md flex-col gap-4">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {tAuth("backToLogin")}
        </Link>

        <Card className="surface-card w-full border-white/90 py-0 shadow-none">
          <CardHeader className="border-b border-border/70 px-6 py-6">
            <div className="mb-4 flex items-center gap-3">
              <PocketMintLogo wrapperClassName="text-primary" markSize={32} />
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/12 bg-white/82 px-3 py-1.5 text-[11px] font-semibold tracking-[0.08em] text-primary">
                <ShieldCheck className="size-3.5" />
                {t("badge")}
              </div>
            </div>
            <CardTitle className="text-2xl font-semibold text-foreground">
              {t("title")}
            </CardTitle>
            <CardDescription className="text-sm leading-6 text-muted-foreground">
              {t("subtitle")}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 py-6">
            {verifying ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                {t("verifying")}
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                {!sessionReady ? (
                  <div className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
                    {t("invalidLink")}
                  </div>
                ) : null}

                <div className="space-y-2">
                  <label
                    htmlFor="newPassword"
                    className="text-sm font-medium text-foreground"
                  >
                    {t("newPassword")}
                  </label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder={t("newPasswordPlaceholder")}
                      aria-invalid={error ? "true" : "false"}
                      className="h-11 border-border/80 bg-input px-3 pr-11 text-foreground placeholder:text-muted-foreground"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={
                        showPassword ? tAuth("hidePassword") : tAuth("showPassword")
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium text-foreground"
                  >
                    {t("confirmNewPassword")}
                  </label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder={t("confirmNewPasswordPlaceholder")}
                    aria-invalid={error ? "true" : "false"}
                    className="h-11 border-border/80 bg-input px-3 text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                {error ? (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                ) : null}

                <Button
                  type="submit"
                  size="lg"
                  disabled={loading || !sessionReady}
                  className="h-11 w-full justify-center bg-primary text-primary-foreground hover:bg-primary/92"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      {t("updating")}
                    </>
                  ) : (
                    <>
                      <KeyRound className="size-4" />
                      {t("submit")}
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
