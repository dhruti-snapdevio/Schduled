import { Button, Hr, Section, Text } from "react-email";
import { EmailLayout, emailStyles } from "./layout";

interface ApprovalOutcomeEmailProps {
  approved: boolean;
  cancelUrl?: string | null;
  eventName: string;
  hostName: string;
  inviteeName: string;
  locationLabel: string;
  meetLabel?: string;
  meetLink?: string | null;
  rejectionReason?: string | null;
  rescheduleUrl?: string | null;
  whenHost: string;
  whenInvitee: string;
  hostTimezone: string;
  inviteeTimezone: string;
}

const teal = "#0D9488";
const red = "#EF4444";

export function ApprovalOutcomeEmail({
  approved,
  cancelUrl,
  eventName,
  hostName,
  inviteeName,
  locationLabel,
  meetLabel,
  meetLink,
  rejectionReason,
  rescheduleUrl,
  whenHost,
  whenInvitee,
  hostTimezone,
  inviteeTimezone,
}: ApprovalOutcomeEmailProps) {
  const badgeColor = approved ? teal : red;
  const badgeBg = approved ? "#CCFBF1" : "#FEE2E2";
  const badgeText = approved ? "Booking Confirmed" : "Booking Declined";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const logoUrl = appUrl ? `${appUrl}/logo.svg` : undefined;

  return (
    <EmailLayout logoUrl={logoUrl}
      preview={
        approved
          ? `Confirmed: ${eventName} with ${hostName}`
          : `Declined: ${eventName} with ${hostName}`
      }
    >
      {/* Badge */}
      <Section style={{ marginBottom: "8px" }}>
        <Text
          style={{
            backgroundColor: badgeBg,
            borderRadius: "4px",
            color: badgeColor,
            display: "inline-block",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.05em",
            padding: "4px 10px",
            textTransform: "uppercase",
          }}
        >
          {badgeText}
        </Text>
      </Section>

      <Text style={{ ...emailStyles.heading, color: "#171717" }}>
        {approved ? "Your booking is confirmed!" : "Your booking request was declined"}
      </Text>

      <Text style={emailStyles.paragraph}>
        Hi {inviteeName},{" "}
        {approved
          ? `your request for ${eventName} with ${hostName} has been approved. See the details below.`
          : `unfortunately ${hostName} is unable to accept your booking request for ${eventName}.`}
      </Text>

      {!approved && rejectionReason && (
        <Section
          style={{
            backgroundColor: "#FEE2E2",
            borderLeft: `3px solid ${red}`,
            marginBottom: "16px",
            padding: "12px 16px",
          }}
        >
          <Text style={{ ...emailStyles.muted, margin: "0", fontWeight: 600 }}>
            Reason provided:
          </Text>
          <Text style={{ ...emailStyles.paragraph, margin: "4px 0 0" }}>
            {rejectionReason}
          </Text>
        </Section>
      )}

      <Hr style={{ borderColor: "#E5E7EB", margin: "20px 0" }} />

      {/* Details */}
      <Section>
        <DetailRow label="Event" value={eventName} />
        <DetailRow label="With" value={hostName} />
        <DetailRow label={`Date & Time (${hostTimezone})`} value={whenHost} />
        {inviteeTimezone !== hostTimezone && (
          <DetailRow label={`Date & Time (${inviteeTimezone})`} value={whenInvitee} />
        )}
        <DetailRow label="Location" value={locationLabel} />
      </Section>

      {approved && (meetLink || cancelUrl) && (
        <>
          <Hr style={{ borderColor: "#E5E7EB", margin: "20px 0" }} />
          <Section style={{ textAlign: "center" as const }}>
            {meetLink && (
              <Button
                href={meetLink}
                style={{
                  ...emailStyles.button,
                  backgroundColor: teal,
                  marginBottom: "12px",
                }}
              >
                {meetLabel ?? "Join Meeting"}
              </Button>
            )}
          </Section>
          {(cancelUrl || rescheduleUrl) && (
            <Text
              style={{
                ...emailStyles.muted,
                textAlign: "center" as const,
                marginTop: "12px",
              }}
            >
              {rescheduleUrl && (
                <a href={rescheduleUrl} style={emailStyles.link}>
                  Reschedule
                </a>
              )}
              {rescheduleUrl && cancelUrl && " · "}
              {cancelUrl && (
                <a href={cancelUrl} style={emailStyles.link}>
                  Cancel
                </a>
              )}
            </Text>
          )}
        </>
      )}

      {!approved && (
        <Text style={{ ...emailStyles.muted, textAlign: "center" as const, marginTop: "16px" }}>
          Feel free to reach out to {hostName} directly if you have questions.
        </Text>
      )}
    </EmailLayout>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Section style={{ marginBottom: "8px" }}>
      <Text style={{ ...emailStyles.muted, margin: "0" }}>{label}</Text>
      <Text style={{ ...emailStyles.paragraph, fontWeight: 600, margin: "2px 0 0" }}>
        {value}
      </Text>
    </Section>
  );
}
