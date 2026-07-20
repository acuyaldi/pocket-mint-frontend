"use client";

import { Suspense, useActionState, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { login, signInWithGoogle, signup } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { mapAuthErrorKey } from "@/lib/auth/map-auth-error";
import { PocketMintLogo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PulseBeams } from "@/components/ui/pulse-beams";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

type AuthMode = "signin" | "signup" | "forgot";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.82-.07-1.6-.2-2.36H12v4.47h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.74Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.29a12 12 0 0 0 0 10.76l3.98-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginForm() {
  const t = useTranslations("auth");
  const tRoot = useTranslations();
  const searchParams = useSearchParams();

  const accessHighlights = [
    { label: t("highlights.encrypted.label"), value: t("highlights.encrypted.value"), icon: ShieldCheck },
    { label: t("highlights.readable.label"), value: t("highlights.readable.value"), icon: Wallet },
    { label: t("highlights.private.label"), value: t("highlights.private.value"), icon: CalendarClock },
  ];

  function validateSignup(formData: FormData): string | null {
    const name = ((formData.get("name") as string) ?? "").trim();
    const email = ((formData.get("email") as string) ?? "").trim();
    const password = (formData.get("password") as string) ?? "";
    const confirm = (formData.get("confirmPassword") as string) ?? "";

    if (!name) return t("errors.nameRequired");
    if (!emailPattern.test(email)) return t("errors.invalidEmail");
    if (password.length < 8) return t("errors.passwordMinLength");
    if (password !== confirm) return t("errors.passwordMismatch");
    return null;
  }
  const [authMode, setAuthMode] = useState<AuthMode>(() =>
    searchParams.get("mode") === "register" ? "signup" : "signin"
  );
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  // Confirmation shown after a reset-password email is dispatched.
  const [resetSent, setResetSent] = useState(false);
  // Controlled so it can be prefilled when returning from the verification
  // modal; password fields stay uncontrolled and are cleared via ref.
  const [emailValue, setEmailValue] = useState("");
  const passwordRef = useRef<HTMLInputElement>(null);
  // Email a just-completed signup sent a verification link to; non-null opens
  // the modal. Set only from the signup action's own success result, never
  // from user-typed input, so it can't be used to probe arbitrary addresses.
  const [verifyingEmail, setVerifyingEmail] = useState<string | null>(null);

  const isSignUp = authMode === "signup";
  const isForgot = authMode === "forgot";
  // Google OAuth runs as a server action that redirects to the provider on
  // success; useActionState lets us surface an initiation error if one occurs.
  const [googleState, googleAction, googlePending] = useActionState(
    async () => (await signInWithGoogle()) ?? null,
    null
  );
  // Show the first available error: a submit/validation error, a Google
  // init error, or an OAuth failure bounced back from /auth/callback (?error=).
  const displayError = error ?? googleState?.error ?? searchParams.get("error");
  // Success banner bounced back from the reset-password page (?message=).
  const successMessage = searchParams.get("message");

  function switchMode(mode: AuthMode) {
    setAuthMode(mode);
    setError(null);
    setShowPassword(false);
    setResetSent(false);
  }

  // Primary and close actions on the verification modal both return to a
  // clean login form: preserve the email so the user doesn't retype it once
  // verified, but drop the passwords so a stale signup attempt can't replay.
  function handleBackToLogin() {
    const email = verifyingEmail;
    setVerifyingEmail(null);
    switchMode("signin");
    if (email) setEmailValue(email);
    if (passwordRef.current) passwordRef.current.value = "";
  }

  // Forgot-password: mail a reset link via Supabase. Kept client-side per
  // Supabase's recommended flow so the browser client holds the PKCE verifier
  // needed to exchange the recovery code on /auth/reset-password.
  async function handleResetSubmit(formData: FormData) {
    const email = ((formData.get("email") as string) ?? "").trim();
    if (!emailPattern.test(email)) {
      setError(t("errors.invalidEmail"));
      return;
    }

    setError(null);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: `${window.location.origin}/auth/reset-password` }
    );

    if (resetError) {
      setError(tRoot(`authErrors.${mapAuthErrorKey(resetError.message)}`));
      return;
    }
    setResetSent(true);
  }

  async function handleSubmit(formData: FormData) {
    if (isForgot) {
      await handleResetSubmit(formData);
      return;
    }

    setError(null);

    if (isSignUp) {
      const validationError = validateSignup(formData);
      if (validationError) {
        setError(validationError);
        return;
      }

      const result = await signup(formData);
      if (result && "error" in result) {
        setError(tRoot(`authErrors.${mapAuthErrorKey(result.error)}`));
        return;
      }
      if (result?.requiresVerification) {
        setVerifyingEmail(result.email);
      }
      return;
    }

    const result = await login(formData);
    if (result?.error) {
      setError(tRoot(`authErrors.${mapAuthErrorKey(result.error)}`));
    }
  }

  // React runs form actions inside a transition, so useState updates made
  // during the action don't paint until it settles; a manual "loading" flag
  // never shows. useActionState's pending flag does paint, and stays true
  // through the server-side redirect to /dashboard.
  const [, submitAction, submitPending] = useActionState(
    async (_prev: null, formData: FormData) => {
      await handleSubmit(formData);
      return null;
    },
    null
  );

  const busy = submitPending || googlePending;

  return (
    <div className="min-h-[100dvh] bg-background px-5 py-5 text-foreground md:px-8 md:py-8">
      <div className="mx-auto grid min-h-[calc(100dvh-2.5rem)] w-full max-w-7xl overflow-hidden rounded-2xl border border-border bg-card md:min-h-[calc(100dvh-4rem)] lg:grid-cols-[minmax(0,1fr)_440px]">
        <section className="relative order-2 flex flex-col justify-between isolate overflow-hidden border-t border-border bg-muted px-6 py-10 sm:px-10 lg:order-1 lg:border-r lg:border-t-0 lg:px-12 lg:py-12">
          <PulseBeams variant="panel" className="text-primary opacity-45" />
          <div className="relative z-10">
            <PocketMintLogo wrapperClassName="text-primary" markSize={32} />
            <div className="mt-16 max-w-xl lg:mt-28">
              <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">
                {t("workspaceLabel")}
              </p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-foreground lg:text-5xl">
                {t("heroTitle")}
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
                {t("heroSubtitle")}
              </p>
            </div>
            <div className="mt-12 max-w-xl">
              {accessHighlights.map((highlight) => {
                const Icon = highlight.icon;

                return (
                  <div
                    key={highlight.label}
                    className="grid grid-cols-[24px_1fr] gap-4 border-t border-border py-4"
                  >
                    <Icon
                      aria-hidden="true"
                      className="mt-0.5 size-5 text-primary"
                      strokeWidth={1.75}
                    />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {highlight.label}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {highlight.value}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="order-1 flex items-center justify-center px-5 py-8 sm:px-8 lg:order-2">
          <div className="flex w-full max-w-md flex-col gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              {t("backToLanding")}
            </Link>
            <Card className="w-full max-w-md border-border bg-card py-0 shadow-none">
              <CardHeader className="border-b border-border/70 px-6 py-6">
                <CardTitle className="text-2xl font-semibold text-foreground">
                  {isForgot
                    ? t("forgotTitle")
                    : isSignUp
                      ? t("signUpTitle")
                      : t("signInTitle")}
                </CardTitle>
                <CardDescription className="text-sm leading-6 text-muted-foreground">
                  {isForgot
                    ? t("forgotSubtitle")
                    : isSignUp
                      ? t("signUpSubtitle")
                      : t("signInSubtitle")}
                </CardDescription>
              </CardHeader>

              <CardContent className="px-6 py-6">
                <form action={submitAction} className="space-y-5">
                  {isSignUp ? (
                    <div className="space-y-2">
                      <label
                        htmlFor="name"
                        className="text-sm font-medium text-foreground"
                      >
                        {t("fields.name")}
                      </label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        required
                        autoComplete="name"
                        placeholder={t("fields.namePlaceholder")}
                        className="h-11 border-border/80 bg-input px-3 text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="text-sm font-medium text-foreground"
                    >
                      {t("fields.email")}
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder={t("fields.emailPlaceholder")}
                      value={emailValue}
                      onChange={(event) => setEmailValue(event.target.value)}
                      className="h-11 border-border/80 bg-input px-3 text-foreground placeholder:text-muted-foreground"
                    />
                  </div>

                  {!isForgot ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <label
                          htmlFor="password"
                          className="text-sm font-medium text-foreground"
                        >
                          {t("fields.password")}
                        </label>
                        {authMode === "signin" ? (
                          <button
                            type="button"
                            onClick={() => switchMode("forgot")}
                            className="text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                          >
                            {t("forgotPassword")}
                          </button>
                        ) : null}
                      </div>
                      <div className="relative">
                        <Input
                          ref={passwordRef}
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          required
                          minLength={isSignUp ? 8 : undefined}
                          autoComplete={
                            isSignUp ? "new-password" : "current-password"
                          }
                          placeholder={
                            isSignUp
                              ? t("fields.passwordPlaceholderSignup")
                              : t("fields.passwordPlaceholderSignin")
                          }
                          aria-invalid={displayError ? "true" : "false"}
                          className="h-11 border-border/80 bg-input px-3 pr-11 text-foreground placeholder:text-muted-foreground"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((value) => !value)}
                          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                          aria-label={
                            showPassword ? t("hidePassword") : t("showPassword")
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
                  ) : null}

                  {isSignUp ? (
                    <div className="space-y-2">
                      <label
                        htmlFor="confirmPassword"
                        className="text-sm font-medium text-foreground"
                      >
                        {t("fields.confirmPassword")}
                      </label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={8}
                        autoComplete="new-password"
                        placeholder={t("fields.confirmPasswordPlaceholder")}
                        aria-invalid={displayError ? "true" : "false"}
                        className="h-11 border-border/80 bg-input px-3 text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                  ) : null}

                  {successMessage && !isForgot ? (
                    <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
                      <CheckCircle2 className="size-4 shrink-0" />
                      {successMessage}
                    </div>
                  ) : null}

                  {isForgot && resetSent ? (
                    <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
                      <CheckCircle2 className="size-4 shrink-0" />
                      {t("resetSentMessage")}
                    </div>
                  ) : null}

                  {displayError ? (
                    <p className="text-sm text-destructive" role="alert">
                      {displayError}
                    </p>
                  ) : null}

                  <Button
                    type="submit"
                    size="lg"
                    disabled={busy}
                    className="h-11 w-full justify-center bg-primary text-primary-foreground hover:bg-primary/92"
                  >
                    {submitPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        {isForgot
                          ? t("sendingLink")
                          : isSignUp
                            ? t("creatingAccount")
                            : t("signingIn")}
                      </>
                    ) : isForgot ? (
                      t("sendResetLink")
                    ) : isSignUp ? (
                      t("createAccount")
                    ) : (
                      t("signIn")
                    )}
                  </Button>
                </form>

                {isForgot ? (
                  <p className="mt-5 text-center text-sm text-muted-foreground">
                    {t("rememberedPassword")}{" "}
                    <button
                      type="button"
                      onClick={() => switchMode("signin")}
                      className="font-semibold text-primary transition-colors hover:text-primary/80"
                    >
                      {t("backToSignIn")}
                    </button>
                  </p>
                ) : (
                  <>
                    <div className="mt-5 flex items-center gap-3">
                      <span className="h-px flex-1 bg-border" />
                      <span className="text-xs font-medium tracking-wide text-muted-foreground">
                        {t("orContinueWith")}
                      </span>
                      <span className="h-px flex-1 bg-border" />
                    </div>

                    <form action={googleAction} className="mt-5">
                      <Button
                        type="submit"
                        size="lg"
                        variant="outline"
                        disabled={busy}
                        className="h-11 w-full justify-center gap-2 border-border/80 bg-card text-foreground hover:bg-muted"
                      >
                        {googlePending ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <GoogleIcon className="size-4" />
                        )}
                        {t("continueWithGoogle")}
                      </Button>
                    </form>

                    <p className="mt-5 text-center text-sm text-muted-foreground">
                      {isSignUp
                        ? `${t("alreadyHaveAccount")} `
                        : `${t("noAccount")} `}
                      <button
                        type="button"
                        onClick={() => switchMode(isSignUp ? "signin" : "signup")}
                        className="font-semibold text-primary transition-colors hover:text-primary/80"
                      >
                        {isSignUp ? t("signIn") : t("signUp")}
                      </button>
                    </p>
                  </>
                )}

                <div className="mt-5 rounded-xl border border-border/70 bg-muted/55 px-4 py-3 text-sm text-muted-foreground">
                  {t("privacyNotice")}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>

      <Dialog
        open={verifyingEmail !== null}
        onOpenChange={(open) => {
          if (!open) handleBackToLogin();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="text-lg font-semibold text-foreground">
            {t("verifyEmail.title")}
          </DialogTitle>
          <DialogDescription
            render={<div />}
            className="space-y-1 text-sm text-muted-foreground"
          >
            <p>{t("verifyEmail.body")}</p>
            <p className="font-medium text-foreground">{verifyingEmail}</p>
            <p>{t("verifyEmail.explanation")}</p>
          </DialogDescription>
          <Button
            type="button"
            size="lg"
            onClick={handleBackToLogin}
            className="h-11 w-full justify-center bg-primary text-primary-foreground hover:bg-primary/92"
          >
            {t("verifyEmail.backToLogin")}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
