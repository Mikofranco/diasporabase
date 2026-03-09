import { sendMailServer } from "@/services/mail/send-mail-server";

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * Sends email via the server action (which uses INTERNAL_API_SECRET).
 * Use this from client components instead of calling /api/send-email directly.
 */
export async function useSendMail({
  to,
  subject,
  html,
  text,
  onSuccess,
  onError,
}: SendMailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await sendMailServer({ to, subject, html, text });

    if (!result.success) {
      const errorMsg = result.error || "Failed to send email";
      onError?.(errorMsg);
      return { success: false, error: errorMsg };
    }

    onSuccess?.();
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Network error";
    onError?.(errorMsg);
    console.error("[sendMail] Error:", err);
    return { success: false, error: errorMsg };
  }
}