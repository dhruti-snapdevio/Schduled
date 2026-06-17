"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { disconnectZoom } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";

export function ZoomDisconnectButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDisconnect() {
    // biome-ignore lint/suspicious/noAlert: native confirm is the project pattern for destructive settings actions
    const ok = confirm(
      "Disconnect Zoom? New bookings will no longer get a Zoom link."
    );
    if (!ok) {
      return;
    }
    startTransition(async () => {
      await disconnectZoom();
      router.refresh();
    });
  }

  return (
    <Button
      disabled={isPending}
      onClick={handleDisconnect}
      size="sm"
      variant="outline"
    >
      Disconnect
    </Button>
  );
}
