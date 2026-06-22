"use client";

import { useState } from "react";
import { deleteEventTypeAction } from "@/app/actions/orbit-users";
import { Button } from "@/components/ui/button";

export function EventTypeDeleteButton({
  eventTypeId,
  hostUserId,
}: {
  eventTypeId: string;
  hostUserId: string;
}) {
  const [confirm, setConfirm] = useState(false);

  if (confirm) {
    return (
      <div className="flex items-center gap-1.5">
        <form action={deleteEventTypeAction}>
          <input type="hidden" name="eventTypeId" value={eventTypeId} />
          <input type="hidden" name="hostUserId" value={hostUserId} />
          <Button type="submit" variant="destructive" size="sm" className="h-6 px-2 text-xs">
            Confirm Delete
          </Button>
        </form>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => setConfirm(false)}
        >
          No
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-6 px-2 text-xs border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
      onClick={() => setConfirm(true)}
    >
      Delete
    </Button>
  );
}
