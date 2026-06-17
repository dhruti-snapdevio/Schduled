import { createElement } from "react";
import { PRODUCT_NAME } from "@/config/platform";
import { DeleteConfirmationEmail } from "@/lib/email/components/delete-confirmation";
import { renderEmailTemplate } from "@/lib/email/renderer";

export async function deleteConfirmationTemplate({
  code,
  email,
}: {
  code: string;
  email: string;
}) {
  const html = await renderEmailTemplate(
    createElement(DeleteConfirmationEmail, {
      code,
      email,
      productName: PRODUCT_NAME,
    })
  );

  const text = `Confirm account deletion — ${PRODUCT_NAME}

Your confirmation code is: ${code}

This code expires in 15 minutes.

If you did not request account deletion, ignore this email — your account is safe.`;

  return { html, text };
}
