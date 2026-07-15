"use client";

import { type FormEvent, useState, useTransition } from "react";
import { Trash } from "@phosphor-icons/react";
import { deleteInviteeDataAction } from "@/app/actions/members";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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

export function DataDeletionCard() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  function confirmDelete() {
    setError(null);
    setDone(false);
    const fd = new FormData();
    fd.append("email", email);
    startTransition(async () => {
      const result = await deleteInviteeDataAction(fd);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setDone(true);
      setEmail("");
    });
  }

  return (
    <Card>
      <CardHeader className="gap-2.5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center border border-border bg-muted/40 text-muted-foreground">
            <Trash size={15} weight="bold" />
          </span>
          <CardTitle className="text-base font-semibold">Data deletion</CardTitle>
        </div>
        <CardDescription>
          Remove a specific invitee's personal data (name, email, phone) from
          bookings and contacts, instance-wide.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={onSubmit}>
          <div className="flex-1 space-y-2">
            <Label htmlFor="deletion-email">Invitee email</Label>
            <Input
              id="deletion-email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="invitee@example.com"
              type="email"
              value={email}
            />
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={!email || isPending} type="button" variant="destructive">
                {isPending ? "Deleting…" : "Delete data"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete data for {email}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently redacts their name, email, and phone from
                  every booking and removes their contact-book entries across
                  the whole workspace. Booking records stay for host
                  accounting, but with no personal data attached. This cannot
                  be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={confirmDelete}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </form>
        {error && (
          <p className="mt-3 rounded-none bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
        )}
        {done && <p className="mt-3 text-sm text-success">Data deleted.</p>}
      </CardContent>
    </Card>
  );
}
