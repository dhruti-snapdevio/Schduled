import { Button, Link, Section, Text } from "react-email";
import { PRODUCT_NAME } from "@/config/platform";
import { EmailLayout, emailStyles } from "@/lib/email/components/layout";

export function InvitationEmail({
  inviteeEmail,
  inviterName,
  role,
  acceptUrl,
  workspaceName = PRODUCT_NAME,
  logoUrl,
}: {
  inviteeEmail: string;
  inviterName: string;
  role: "member" | "manager";
  acceptUrl: string;
  workspaceName?: string;
  logoUrl?: string | null;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const resolvedLogoUrl = logoUrl ?? (appUrl ? `${appUrl}/email-logo.png` : undefined);
  const roleLabel = role === "manager" ? "manager" : "member";

  return (
    <EmailLayout
      preview={`${inviterName} invited you to ${workspaceName}`}
      productName={workspaceName}
      logoUrl={resolvedLogoUrl}
    >
      <Text style={emailStyles.heading}>You're invited to {workspaceName}</Text>
      <Text style={emailStyles.paragraph}>
        <strong style={{ color: "#171717" }}>{inviterName}</strong> invited{" "}
        <strong style={{ color: "#171717" }}>{inviteeEmail}</strong> to join{" "}
        {workspaceName} as a {roleLabel}.
      </Text>
      <Section style={{ margin: "24px 0" }}>
        <Button href={acceptUrl} style={emailStyles.button}>
          Accept Invitation
        </Button>
      </Section>
      <Text style={emailStyles.muted}>
        This invitation expires in 7 days and can only be used once.
      </Text>
      <Text style={emailStyles.fallbackLink}>
        If the button does not work, paste this link into your browser:{" "}
        <Link href={acceptUrl} style={emailStyles.link}>
          {acceptUrl}
        </Link>
      </Text>
    </EmailLayout>
  );
}
