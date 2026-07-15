import { WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PRODUCT_NAME } from "@/config/platform";
import { findPendingInvitationByToken } from "@/lib/invitations";
import { getEffectiveSignInMethods } from "@/lib/settings/sign-in-methods";
import { InviteAcceptForm } from "./_components/invite-accept-form";

export const metadata = { title: "Accept invitation" };

export default async function InviteAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await findPendingInvitationByToken(token);

  if (!invite) {
    return (
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <WarningCircle size={20} weight="fill" className="text-destructive" />
              Invitation expired or used
            </CardTitle>
            <CardDescription>
              This invite link is no longer valid. Ask whoever invited you to
              {" "}{PRODUCT_NAME} to send a new one.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const methods = await getEffectiveSignInMethods();

  return (
    <InviteAcceptForm
      email={invite.email}
      role={invite.role}
      googleEnabled={methods.google}
      magicLinkEnabled={methods.magicLink}
      passwordEnabled={methods.password}
    />
  );
}
