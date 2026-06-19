"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  setUserRoleAction,
  toggleUserBanAction,
} from "@/app/actions/orbit-users";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { ADMIN_ROLE, USER_ROLE } from "@/config/platform";

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
        <input name="role" type="hidden" value={isAdmin ? USER_ROLE : ADMIN_ROLE} />
        <Button
          type="submit"
          variant={isAdmin ? "destructive" : "outline"}
          size="sm"
          className="w-full justify-start text-xs"
        >
          {isAdmin ? "Remove Admin" : "Make Admin"}
        </Button>
      </form>

      {/* Ban / Unban */}
      <form action={toggleUserBanAction}>
        <input name="userId" type="hidden" value={userId} />
        <input name="banned" type="hidden" value={String(!banned)} />
        <Button
          type="submit"
          variant={banned ? "secondary" : "outline"}
          size="sm"
          className="w-full justify-start text-xs"
        >
          {banned ? "Reactivate Account" : "Suspend Account"}
        </Button>
      </form>

      {/* Impersonate */}
      <Button
        variant="secondary"
        size="sm"
        className="w-full justify-start text-xs"
        disabled={impersonating || banned}
        onClick={handleImpersonate}
      >
        {impersonating ? "Switching…" : "Impersonate User"}
      </Button>

      {impersonateError && (
        <p className="text-xs text-destructive">{impersonateError}</p>
      )}

      {!banned && (
        <p className="pt-1 text-2xs text-muted-foreground">
          Impersonation opens the app as this user. You can return by signing out.
        </p>
      )}
    </div>
  );
}
