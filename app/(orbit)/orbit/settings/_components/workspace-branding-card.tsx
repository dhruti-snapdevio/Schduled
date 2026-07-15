"use client";

import { useState, useTransition } from "react";
import { Buildings } from "@phosphor-icons/react";
import { updateWorkspaceBrandingAction } from "@/app/actions/orbit-settings";
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

export function WorkspaceBrandingCard({
  initialName,
  initialLogoUrl,
}: {
  initialName: string;
  initialLogoUrl: string | null;
}) {
  const [name, setName] = useState(initialName);
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateWorkspaceBrandingAction({ name, logoUrl: logoUrl || null });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  return (
    <Card>
      <CardHeader className="gap-2.5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center border border-border bg-muted/40 text-muted-foreground">
            <Buildings size={15} weight="bold" />
          </span>
          <CardTitle className="text-base font-semibold">Workspace</CardTitle>
        </div>
        <CardDescription>
          Your workspace name and logo, shown across the Admin Center and
          transactional emails.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <div className="space-y-2">
          <Label htmlFor="workspace-name">Workspace name</Label>
          <Input
            id="workspace-name"
            onChange={(e) => setName(e.target.value)}
            value={name}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="workspace-logo">Logo URL</Label>
          <Input
            id="workspace-logo"
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://…"
            value={logoUrl}
          />
        </div>
        {error && (
          <p className="rounded-none bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
        )}
        <div className="flex items-center gap-3">
          <Button disabled={isPending} onClick={onSubmit} type="button">
            {isPending ? "Saving…" : "Save changes"}
          </Button>
          {saved && <p className="text-sm text-success">Saved.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
