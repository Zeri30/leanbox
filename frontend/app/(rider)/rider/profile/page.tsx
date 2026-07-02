"use client";

import { useMemo, useState, type FormEvent } from "react";

import { Field, FormBanner } from "@/components/auth/field";
import { useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  errorMessage,
  fieldErrors,
  useMe,
  useUpdatePassword,
  useUpdateProfile,
} from "@/lib/auth";

function ProfileCard() {
  const { toast } = useToast();
  const { data: user, isLoading } = useMe();
  const update = useUpdateProfile();

  const initial = useMemo(
    () => ({
      full_name: user?.full_name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
    }),
    [user],
  );

  const [form, setForm] = useState(initial);
  const [hydrated, setHydrated] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);

  if (user && !hydrated) {
    setForm(initial);
    setHydrated(true);
  }

  const dirty =
    form.full_name !== initial.full_name ||
    form.email !== initial.email ||
    form.phone !== initial.phone;

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!dirty) return;
    setErrors({});
    setBanner(null);
    try {
      await update.mutateAsync({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone.trim() || null,
      });
      toast("Profile updated.", "success");
    } catch (err) {
      setErrors(fieldErrors(err));
      setBanner(errorMessage(err));
    }
  }

  if (isLoading || !user) {
    return (
      <Card className="gap-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="mb-4">
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {banner && <FormBanner>{banner}</FormBanner>}
        <Field
          id="full_name"
          name="full_name"
          label="Full name"
          value={form.full_name}
          onChange={(e) => set("full_name", e.target.value)}
          autoComplete="name"
          required
          error={errors.full_name}
        />
        <Field
          id="email"
          name="email"
          type="email"
          label="Email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          autoComplete="email"
          required
          error={errors.email}
        />
        <Field
          id="phone"
          name="phone"
          type="tel"
          label="Phone (optional)"
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          autoComplete="tel"
          error={errors.phone}
        />
        <Button type="submit" disabled={!dirty || update.isPending}>
          {update.isPending ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </Card>
  );
}

const EMPTY_PW = {
  current_password: "",
  password: "",
  password_confirmation: "",
};

function PasswordCard() {
  const { toast } = useToast();
  const update = useUpdatePassword();
  const [form, setForm] = useState(EMPTY_PW);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);

  const dirty = Object.values(form).some((v) => v !== "");

  function set(key: keyof typeof EMPTY_PW, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!dirty) return;
    setErrors({});
    setBanner(null);
    try {
      await update.mutateAsync(form);
      toast("Password updated.", "success");
      setForm(EMPTY_PW);
    } catch (err) {
      setErrors(fieldErrors(err));
      setBanner(errorMessage(err));
    }
  }

  return (
    <Card>
      <CardHeader className="mb-4">
        <CardTitle>Change password</CardTitle>
      </CardHeader>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {banner && <FormBanner>{banner}</FormBanner>}
        <Field
          id="current_password"
          name="current_password"
          type="password"
          label="Current password"
          value={form.current_password}
          onChange={(e) => set("current_password", e.target.value)}
          autoComplete="current-password"
          required
          error={errors.current_password}
        />
        <Field
          id="password"
          name="password"
          type="password"
          label="New password"
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
          autoComplete="new-password"
          required
          error={errors.password}
        />
        <Field
          id="password_confirmation"
          name="password_confirmation"
          type="password"
          label="Confirm new password"
          value={form.password_confirmation}
          onChange={(e) => set("password_confirmation", e.target.value)}
          autoComplete="new-password"
          required
          error={errors.password_confirmation}
        />
        <Button type="submit" disabled={!dirty || update.isPending}>
          {update.isPending ? "Updating…" : "Update password"}
        </Button>
      </form>
    </Card>
  );
}

export default function RiderProfilePage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account details.
        </p>
      </div>
      <ProfileCard />
      <PasswordCard />
    </div>
  );
}
