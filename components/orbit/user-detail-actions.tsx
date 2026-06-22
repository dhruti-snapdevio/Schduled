"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  deleteUserAction,
  setUserRoleAction,
  toggleUserBanAction,
} from "@/app/actions/orbit-users";
import { Button } from "@/components/ui/button";
import { ADMIN_ROLE, USER_ROLE } from "@/config/platform";
import { authClient } from "@/lib/auth-client";

export function UserDetailActions({
  userId,
  role,
  banned,
}: {
  userId: string;
  role: string | null;
  banned: boolean;
}) {
  const router = useRouter();
  const [impersonating, setImpersonating] = useState(false);
  const [impersonateError, setImpersonateError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isAdmin = role === ADMIN_ROLE;

  async function handleImpersonate() {
    setImpersonating(true);
    setImpersonateError(null);
    try {
      await authClient.admin.impersonateUser({ userId });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("[impersonate]", err);
      setImpersonateError("Impersonation failed. Try again.");
      setImpersonating(false);
    }
  }

  return (
    <div className="space-y-2">
      {/* Role toggle */}
      <form action={setUserRoleAction}>
        <input name="userId" type="hidden" value={userId} />
        <input
          name="role"
          type="hidden"
          value={isAdmin ? USER_ROLE : ADMIN_ROLE}
        />
        <Button
          className="w-full justify-start text-xs"
          size="sm"
          type="submit"
          variant={isAdmin ? "destructive" : "outline"}
        >
          {isAdmin ? "Remove Admin" : "Make Admin"}
        </Button>
      </form>

      {/* Ban / Unban */}
      <form action={toggleUserBanAction}>
        <input name="userId" type="hidden" value={userId} />
        <input name="banned" type="hidden" value={String(!banned)} />
        <Button
          className="w-full justify-start text-xs"
          size="sm"
          type="submit"
          variant={banned ? "secondary" : "outline"}
        >
          {banned ? "Reactivate Account" : "Suspend Account"}
        </Button>
      </form>

      {/* Impersonate */}
      <Button
        className="w-full justify-start text-xs"
        disabled={impersonating || banned}
        onClick={handleImpersonate}
        size="sm"
        variant="secondary"
      >
        {impersonating ? "Switching…" : "Impersonate User"}
      </Button>

      {impersonateError && (
        <p className="text-xs text-destructive">{impersonateError}</p>
      )}

      {!banned && (
        <p className="pt-1 text-2xs text-muted-foreground">
          Impersonation opens the app as this user. You can return by signing
          out.
        </p>
      )}

      {/* Danger zone — permanent delete */}
      <div className="mt-3 border-t border-destructive/20 pt-3">
        {confirmDelete ? (
          <div className="space-y-2">
            <p className="text-2xs text-destructive">
              This permanently deletes the user and all their bookings, event
              types and data. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <form action={deleteUserAction} className="flex-1">
                <input name="userId" type="hidden" value={userId} />
                <Button
                  className="w-full text-xs"
                  size="sm"
                  type="submit"
                  variant="destructive"
                >
                  Confirm Delete
                </Button>
              </form>
              <Button
                className="flex-1 text-xs"
                onClick={() => setConfirmDelete(false)}
                size="sm"
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            className="w-full justify-start border-destructive/40 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setConfirmDelete(true)}
            size="sm"
            type="button"
            variant="outline"
          >
            Delete User
          </Button>
        )}
      </div>
    </div>
  );
}
