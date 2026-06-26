"use client";

import { useMemo, useState, type FormEvent } from "react";

import { Field, FormBanner } from "@/components/auth/field";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage, fieldErrors, useMe, useUpdateProfile } from "@/lib/auth";
import { useBeforeUnload } from "@/lib/use-before-unload";

interface ProfileForm {
  full_name: string;
  email: string;
  phone: string;
}

export default function ProfilePage() {
  const { data: user, isLoading } = useMe();
  const update = useUpdateProfile();

  const initial = useMemo<ProfileForm>(
    () => ({
      full_name: user?.full_name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
    }),
    [user],
  );

  const [form, setForm] = useState<ProfileForm>(initial);
  const [hydrated, setHydrated] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  // Seed the form once the user loads (without an effect-driven setState loop).
  if (user && !hydrated) {
    setForm(initial);
    setHydrated(true);
  }

  const dirty =
    form.full_name !== initial.full_name ||
    form.email !== initial.email ||
    form.phone !== initial.phone;

  useBeforeUnload(dirty);

  function set<K extends keyof ProfileForm>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!dirty) return;
    setConfirmSave(true);
  }

  async function save() {
    setErrors({});
    setBanner(null);
    setSaved(false);
    try {
      await update.mutateAsync({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone.trim() || null,
      });
      setSaved(true);
      setConfirmSave(false);
    } catch (err) {
      setConfirmSave(false);
      setErrors(fieldErrors(err));
      setBanner(errorMessage(err));
    }
  }

  function discard() {
    setForm(initial);
    setErrors({});
    setBanner(null);
    setConfirmDiscard(false);
  }

  if (isLoading || !user) {
    return (
      <div className="flex max-w-lg flex-col gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold">Profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Update your account information.
      </p>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4" noValidate>
        {banner && <FormBanner>{banner}</FormBanner>}
        {saved && <FormBanner variant="success">Profile updated.</FormBanner>}

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

        <div className="mt-1 flex gap-3">
          <Button type="submit" disabled={!dirty || update.isPending}>
            Save changes
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={!dirty || update.isPending}
            onClick={() => setConfirmDiscard(true)}
          >
            Cancel
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmSave}
        onOpenChange={setConfirmSave}
        title="Save changes?"
        description="This updates your account details."
        confirmText="Save changes"
        loading={update.isPending}
        onConfirm={save}
      />
      <ConfirmDialog
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title="Discard changes?"
        description="Your unsaved edits will be lost."
        confirmText="Discard"
        variant="danger"
        onConfirm={discard}
      />
    </div>
  );
}
