"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useActionState } from "react";
import { UserCircle } from "@phosphor-icons/react";
import { useAvatar } from "@/components/avatar-context";
import {
  type ActionState,
  changeEmailAction,
  removeAvatarAction,
  updateNameAction,
} from "@/app/actions/profile";
import { DeleteAccountModal } from "@/components/profile/delete-account-modal";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const initialState: ActionState = {};

export function AvatarUploadCard({
  currentImageUrl,
}: {
  currentImageUrl?: string | null;
}) {
  const [preview, setPreview] = useState<string | null>(
    currentImageUrl ?? null
  );
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setUrl } = useAvatar();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setSuccess(false);

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Please select a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB.");
      return;
    }

    // Optimistic local preview
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/api/upload/avatar", {
        method: "POST",
        body: form,
      });
      const data: { url?: string; error?: string } = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed. Please try again.");
        setPreview(currentImageUrl ?? null);
      } else {
        const busted = `${data.url}?t=${new Date().getTime()}`;
        setPreview(busted);
        setUrl(busted);
        setSuccess(true);
      }
    } catch {
      setError("Upload failed. Please try again.");
      setPreview(currentImageUrl ?? null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Image</CardTitle>
        <CardDescription>
          Shown on your public booking page and in notification emails.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="group relative size-20 shrink-0 overflow-hidden border-2 border-dashed border-border bg-muted transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            aria-label="Upload profile image"
          >
            {preview ? (
              <Image fill unoptimized src={preview} alt="Profile image" className="object-cover" sizes="80px" />
            ) : (
              <UserCircle size={40} className="m-auto text-muted-foreground" />
            )}

            {uploading ? (
              <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span className="size-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </span>
            ) : (
              <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                <span className="text-xs font-medium text-white">Change</span>
              </span>
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading || removing}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? "Uploading…" : "Change image"}
              </Button>
              {preview && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={uploading || removing}
                  className="text-destructive hover:bg-destructive/5 hover:text-destructive"
                  onClick={async () => {
                    setRemoving(true)
                    setError("")
                    setSuccess(false)
                    const res = await removeAvatarAction()
                    setRemoving(false)
                    if (res.error) {
                      setError(res.error)
                    } else {
                      setPreview(null)
                      setUrl(null)
                      setSuccess(true)
                    }
                  }}
                >
                  {removing ? "Removing…" : "Remove"}
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              JPG, PNG or WebP · max 5 MB · saved at 256×256
            </p>
            {success && (
              <p className="text-xs font-medium text-primary">
                {preview ? "Image updated!" : "Image removed."}
              </p>
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActionMessage({ state }: { state: ActionState }) {
  if (state.error) {
    return (
      <p className="rounded-none bg-destructive/10 p-3 text-destructive text-sm">
        {state.error}
      </p>
    );
  }
  if (state.success) {
    return (
      <p className="rounded-none bg-success-subtle p-3 text-success-foreground text-sm">
        {state.success}
      </p>
    );
  }
  return null;
}

export function AccountIdentityForms({
  email,
  name,
}: {
  email: string;
  name: string;
}) {
  const [nameState, nameAction, namePending] = useActionState(
    updateNameAction,
    initialState
  );
  const [emailState, emailAction, emailPending] = useActionState(
    changeEmailAction,
    initialState
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Display Name</CardTitle>
          <CardDescription>
            The name shown in navigation, audit logs, and admin views.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={nameAction} className="space-y-4">
            <label className="block" htmlFor="name">
              <span className="mb-2 block font-semibold text-foreground text-sm">
                Name
              </span>
              <Input
                defaultValue={name}
                id="name"
                maxLength={100}
                name="name"
              />
            </label>
            <ActionMessage state={nameState} />
            <div className="flex justify-end">
              <Button disabled={namePending} type="submit">
                {namePending ? "Saving..." : "Save name"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Address</CardTitle>
          <CardDescription>
            Magic-link authentication uses this email as the account identity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={emailAction} className="space-y-4">
            <label className="block" htmlFor="email">
              <span className="mb-2 block font-semibold text-foreground text-sm">
                Email
              </span>
              <Input
                defaultValue={email}
                id="email"
                name="email"
                required
                type="email"
              />
            </label>
            <ActionMessage state={emailState} />
            <div className="flex justify-end">
              <Button disabled={emailPending} type="submit">
                {emailPending ? "Saving..." : "Update email"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export function DeleteAccountForm({ email }: { email: string }) {
  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-destructive">Delete Account</CardTitle>
        <CardDescription>
          Permanently delete your account, sessions, meeting types, and all connected
          data. Audit records remain for operator history. This cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DeleteAccountModal email={email} />
      </CardContent>
    </Card>
  );
}
