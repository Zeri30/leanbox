"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
import {
  errorMessage,
  fieldErrors,
  homeForRole,
  useRegister,
} from "@/lib/auth";
import { advanceOnEnter } from "@/lib/forms";

export default function RegisterPage() {
  const router = useRouter();
  const register = useRegister();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setBanner(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      full_name: String(form.get("full_name") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? "").trim() || undefined,
      password: String(form.get("password") ?? ""),
      password_confirmation: String(form.get("password_confirmation") ?? ""),
    };

    try {
      const { user } = await register.mutateAsync(payload);
      router.replace(homeForRole(user.role));
    } catch (err) {
      setErrors(fieldErrors(err));
      setBanner(errorMessage(err));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Create your account</CardTitle>
        <CardDescription>
          Eat lean, live strong — start in under a minute.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={onSubmit}
          onKeyDown={advanceOnEnter}
          className="flex flex-col gap-4"
          noValidate
        >
          {banner && <FormBanner>{banner}</FormBanner>}

          <Field
            id="full_name"
            name="full_name"
            label="Full name"
            placeholder="Juan dela Cruz"
            autoComplete="name"
            required
            error={errors.full_name}
          />
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
          <Field
            id="phone"
            name="phone"
            type="tel"
            label="Phone (optional)"
            placeholder="+63 900 000 0000"
            autoComplete="tel"
            error={errors.phone}
          />
          <Field
            id="password"
            name="password"
            type="password"
            label="Password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            required
            error={errors.password}
          />
          <Field
            id="password_confirmation"
            name="password_confirmation"
            type="password"
            label="Confirm password"
            placeholder="Re-enter your password"
            autoComplete="new-password"
            required
            error={errors.password_confirmation}
          />

          <Button
            type="submit"
            className="mt-1 w-full"
            disabled={register.isPending}
          >
            {register.isPending ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
