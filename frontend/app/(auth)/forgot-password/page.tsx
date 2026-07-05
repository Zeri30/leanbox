"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { Field, FormBanner } from "@/components/auth/field";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  errorMessage,
  fieldErrors,
  useForgotPassword,
  useResetPassword,
  useVerifyResetCode,
} from "@/lib/auth";
import { advanceOnEnter } from "@/lib/forms";

type Step = "request" | "verify" | "reset" | "done";

export default function ForgotPasswordPage() {
  const forgot = useForgotPassword();
  const verify = useVerifyResetCode();
  const reset = useResetPassword();

  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);

  function clearMessages() {
    setErrors({});
    setBanner(null);
  }

  function startOver() {
    clearMessages();
    setCode("");
    setStep("request");
  }

  // Step 1 — request a code for the email.
  async function requestCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    clearMessages();
    const submitted = String(new FormData(e.currentTarget).get("email") ?? "");
    try {
      await forgot.mutateAsync({ email: submitted });
      setEmail(submitted);
      setStep("verify");
    } catch (err) {
      setErrors(fieldErrors(err));
      setBanner(errorMessage(err));
    }
  }

  // Step 2 — verify the code before letting them choose a new password.
  async function verifyCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    clearMessages();
    const submitted = String(new FormData(e.currentTarget).get("code") ?? "");
    try {
      await verify.mutateAsync({ email, code: submitted });
      setCode(submitted);
      setStep("reset");
    } catch (err) {
      setErrors(fieldErrors(err));
      setBanner(errorMessage(err));
    }
  }

  // Step 3 — set the new password using the already-verified code.
  async function resetPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    clearMessages();
    const form = new FormData(e.currentTarget);
    try {
      await reset.mutateAsync({
        email,
        code,
        password: String(form.get("password") ?? ""),
        password_confirmation: String(form.get("password_confirmation") ?? ""),
      });
      setStep("done");
    } catch (err) {
      // If the code expired between steps, send them back to re-enter it.
      const messages = fieldErrors(err);
      setErrors(messages);
      setBanner(errorMessage(err));
      if (Object.keys(messages).length === 0) {
        setStep("verify");
      }
    }
  }

  if (step === "done") {
    return (
      <Card key={step}>
        <CardHeader>
          <CardTitle className="text-xl">Password reset</CardTitle>
          <CardDescription>
            Your password has been changed. Sign in with your new password.
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-3">
          <Button asChild className="w-full">
            <Link href="/login">Go to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "reset") {
    return (
      <Card key={step}>
        <CardHeader>
          <CardTitle className="text-xl">Set a new password</CardTitle>
          <CardDescription>
            Code verified. Choose a new password for your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-3">
          <form
            onSubmit={resetPassword}
            onKeyDown={advanceOnEnter}
            className="flex flex-col gap-4"
            noValidate
          >
            {banner && <FormBanner>{banner}</FormBanner>}

            <Field
              id="password"
              name="password"
              type="password"
              label="New password"
              placeholder="At least 8 characters"
              autoComplete="new-password"
              required
              error={errors.password}
            />
            <Field
              id="password_confirmation"
              name="password_confirmation"
              type="password"
              label="Confirm new password"
              placeholder="Re-enter your new password"
              autoComplete="new-password"
              required
              error={errors.password_confirmation}
            />

            <Button type="submit" className="mt-1 w-full" disabled={reset.isPending}>
              {reset.isPending ? "Saving…" : "Reset password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (step === "verify") {
    return (
      <Card key={step}>
        <CardHeader>
          <CardTitle className="text-xl">Enter your code</CardTitle>
          <CardDescription>
            If that email is registered, we&apos;ve sent a 6-digit code. Enter it
            to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-3">
          <form
            onSubmit={verifyCode}
            onKeyDown={advanceOnEnter}
            className="flex flex-col gap-4"
            noValidate
          >
            {banner && <FormBanner>{banner}</FormBanner>}

            {/* Read-only so the account is clear — and so the browser autofills
                the email here instead of into the code box. */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                value={email}
                readOnly
                autoComplete="email"
                className="text-muted-foreground"
              />
            </div>

            <Field
              id="code"
              name="code"
              label="6-digit code"
              placeholder="123456"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              autoFocus
              required
              error={errors.code}
            />

            <Button type="submit" className="mt-1 w-full" disabled={verify.isPending}>
              {verify.isPending ? "Verifying…" : "Continue"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Didn&apos;t get a code?{" "}
            <button
              type="button"
              onClick={startOver}
              className="font-semibold text-primary hover:underline"
            >
              Start over
            </button>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card key={step}>
      <CardHeader>
        <CardTitle className="text-xl">Forgot your password?</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send a code to reset it.
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-3">
        <form
          onSubmit={requestCode}
          onKeyDown={advanceOnEnter}
          className="flex flex-col gap-4"
          noValidate
        >
          {banner && <FormBanner>{banner}</FormBanner>}

          <Field
            id="email"
            name="email"
            type="email"
            label="Email"
            placeholder="you@example.com"
            autoComplete="email"
            required
            error={errors.email}
          />

          <Button type="submit" className="mt-1 w-full" disabled={forgot.isPending}>
            {forgot.isPending ? "Sending…" : "Send reset code"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Remembered it?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
