import { createElement } from "react";
import { PRODUCT_NAME } from "@/config/platform";
import { InvitationEmail } from "@/lib/email/components/invitation";
import { renderEmailTemplate } from "@/lib/email/renderer";

export async function invitationTemplate({
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
  const html = await renderEmailTemplate(
    createElement(InvitationEmail, {
      inviteeEmail,
      inviterName,
      role,
      acceptUrl,
      workspaceName,
      logoUrl,
    })
  );

  const roleLabel = role === "manager" ? "manager" : "member";
  const text = `You're invited to ${workspaceName}

${inviterName} invited ${inviteeEmail} to join ${workspaceName} as a ${roleLabel}.

Accept the invitation:
${acceptUrl}

This invitation expires in 7 days and can only be used once.`;

  return { html, text };
}
