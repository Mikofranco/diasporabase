"use server";

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

export async function sendMailServer(
  options: SendMailOptions
): Promise<SendMailResult> {
  const { to, subject, html, text } = options;

  // 🔍 DEBUG LOG (server console)
  console.log("[sendMailServer] received:", {
    to,
    subject,
    htmlLength: html?.length,
    text,
  });

  // ❗ REQUIRED FIELD CHECK
  if (!to || !subject || !html) {
    console.error("[sendMailServer] missing required fields", {
      to,
      subject,
      html,
    });

    return {
      success: false,
      error: "Missing required fields: to, subject, or html",
    };
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ to, subject, html, text }),
      }
    );

    const data = await response.json();

    // 🔍 DEBUG API RESPONSE
    console.log("[sendMailServer] api response:", data);

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.details || "Failed to send email",
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error("[sendMailServer] exception:", error);

    return {
      success: false,
      error: error.message || "Server mail error",
    };
  }
}
