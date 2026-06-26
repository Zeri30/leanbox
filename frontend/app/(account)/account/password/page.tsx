"use client";

import { useState, type FormEvent } from "react";

import { Field, FormBanner } from "@/components/auth/field";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { errorMessage, fieldErrors, useUpdatePassword } from "@/lib/auth";
import { useBeforeUnload } from "@/lib/use-before-unload";

const EMPTY = {
  current_password: "",
  password: "",
  password_confirmation: "",
};

export default function ChangePasswordPage() {
  const update = useUpdatePassword();

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const dirty = Object.values(form).some((v) => v !== "");
  useBeforeUnload(dirty);

  function set(key: keyof typeof EMPTY, value: string) {
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
      await update.mutateAsync(form);
      setSaved(true);
      setForm(EMPTY);
      setConfirmSave(false);
    } catch (err) {
      setConfirmSave(false);
      setErrors(fieldErrors(err));
      setBanner(errorMessage(err));
    }
  }

  function discard() {
    setForm(EMPTY);
    setErrors({});
    setBanner(null);
    setConfirmDiscard(false);
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold">Change password</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Use at least 8 characters.
      </p>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4" noValidate>
        {banner && <FormBanner>{banner}</FormBanner>}
        {saved && <FormBanner variant="success">Password updated.</FormBanner>}

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

        <div className="mt-1 flex gap-3">
          <Button type="submit" disabled={!dirty || update.isPending}>
            Update password
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
        title="Update password?"
        description="You'll use the new password the next time you sign in."
        confirmText="Update password"
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
