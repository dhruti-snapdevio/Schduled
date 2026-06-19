import nodemailer from "nodemailer";
import { env } from "@/lib/env";

export interface SmtpAttachment {
  content: string;
  contentType: string;
  encoding?: "base64" | "utf8";
  filename: string;
}

export interface SmtpSendInput {
  attachments?: SmtpAttachment[];
  html: string;
  idempotencyKey?: string;
  subject: string;
  text?: string;
  to: string | string[];
}

export interface SmtpSendResult {
  id: string;
  status: string;
}

export function isSmtpConfigured() {
  return !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS && env.EMAIL_FROM);
}

export async function sendEmailViaSmtp(
  input: SmtpSendInput
): Promise<SmtpSendResult> {
  if (!isSmtpConfigured()) {
    console.log("[email:dev]", {
      subject: input.subject,
      text: input.text,
      to: input.to,
    });
    return {
      id: `dev_${input.idempotencyKey ?? Date.now()}`,
      status: "logged",
    };
  }

  const port = env.SMTP_PORT ?? 587;
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port,
    secure: env.SMTP_SECURE ?? port === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: env.EMAIL_FROM,
    to: Array.isArray(input.to) ? input.to.join(", ") : input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    headers: input.idempotencyKey
      ? { "X-Idempotency-Key": input.idempotencyKey }
      : undefined,
    attachments: input.attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
      contentType: a.contentType,
      encoding: a.encoding,
    })),
  });

  return {
    id: info.messageId ?? `smtp_${Date.now()}`,
    status: "sent",
  };
}
