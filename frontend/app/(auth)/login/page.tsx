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
  useLogin,
} from "@/lib/auth";
import { advanceOnEnter } from "@/lib/forms";

export default function LoginPage() {
  const router = useRouter();
  const login = useLogin();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setBanner(null);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    try {
      const { user } = await login.mutateAsync({ email, password });
      const redirect =
        new URLSearchParams(window.location.search).get("redirect") ??
        homeForRole(user.role);
      router.replace(redirect);
    } catch (err) {
      setErrors(fieldErrors(err));
      setBanner(errorMessage(err));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your Leanbox account.</CardDescription>
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
            id="password"
            name="password"
            type="password"
            label="Password"
            placeholder="••••••••"
            autoComplete="current-password"
            required
            error={errors.password}
          />

          <Button type="submit" className="mt-1 w-full" disabled={login.isPending}>
            {login.isPending ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Create one
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
