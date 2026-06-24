"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

interface GoogleActionsProps {
  hasGoogle: boolean;
  canDisconnect: boolean;
}

export function GoogleActions({ hasGoogle, canDisconnect }: GoogleActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleConnect() {
    setLoading(true);
    try {
      const result = await authClient.linkSocial({
        provider: "google",
        callbackURL: "/profile/login",
      });
      if (result?.data?.url) {
        window.location.href = result.data.url;
        return;
      }
    } catch {
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    setLoading(true);
    try {
      await authClient.unlinkAccount({ providerId: "google" });
      router.refresh();
    } catch {
      setLoading(false);
    }
  }

  if (!hasGoogle) {
    return (
      <Button size="sm" onClick={handleConnect} disabled={loading}>
        {loading ? "Redirecting…" : "Connect"}
      </Button>
    );
  }

  if (!canDisconnect) {
    return (
      <span className="text-xs text-muted-foreground">Only method — cannot remove</span>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleDisconnect}
      disabled={loading}
    >
      {loading ? "Disconnecting…" : "Disconnect"}
    </Button>
  );
}
