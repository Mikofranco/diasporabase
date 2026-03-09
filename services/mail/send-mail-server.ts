"use server";

import { sendEmail } from "@/lib/email";

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendMailResult {
  success: boolean;
  error?: string;
}

/**
 * Sends email from the server using SMTP (lib/email).
 * Use this from server actions or server code. Same path as /api/send-confirmation-email.
 */
export async function sendMailServer(
  options: SendMailOptions
): Promise<SendMailResult> {
  const { to, subject, html, text } = options;

  if (!to || !subject || !html) {
    return {
      success: false,
      error: "Missing required fields: to, subject, or html",
    };
  }

  try {
    await sendEmail({ to, subject, html, text });
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server mail error";
    console.error("[sendMailServer]", message);
    return {
      success: false,
      error: message,
    };
  }
}
