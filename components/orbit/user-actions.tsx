import {
  setUserRoleAction,
  toggleUserBanAction,
} from "@/app/actions/orbit-users";
import { Button } from "@/components/ui/button";
import { ADMIN_ROLE, USER_ROLE } from "@/config/platform";

export function UserRoleForm({
  role,
  userId,
}: {
  role: string | null;
  userId: string;
}) {
  const isAdmin = role === ADMIN_ROLE;
  const nextRole = isAdmin ? USER_ROLE : ADMIN_ROLE;

  return (
    <form action={setUserRoleAction}>
      <input name="userId" type="hidden" value={userId} />
      <input name="role" type="hidden" value={nextRole} />
      <Button
        type="submit"
        variant={isAdmin ? "destructive" : "secondary"}
        size="sm"
        className="text-xs h-7"
      >
        {isAdmin ? "Remove Admin" : "Make Admin"}
      </Button>
    </form>
  );
}

export function UserSuspendForm({
  banned,
  userId,
}: {
  banned: boolean;
  userId: string;
}) {
  return (
    <form action={toggleUserBanAction}>
      <input name="userId" type="hidden" value={userId} />
      <input name="banned" type="hidden" value={String(!banned)} />
      <Button
        type="submit"
        variant={banned ? "secondary" : "outline"}
        size="sm"
        className="text-xs h-7"
      >
        {banned ? "Reactivate" : "Suspend"}
      </Button>
    </form>
  );
}
