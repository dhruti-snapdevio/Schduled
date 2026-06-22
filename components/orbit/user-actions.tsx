import { toggleUserBanAction } from "@/app/actions/orbit-users";
import { Button } from "@/components/ui/button";

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
