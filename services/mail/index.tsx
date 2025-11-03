interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string; 
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export async function useSendMail({
  to,
  subject,
  html,
  text,
  onSuccess,
  onError,
}: SendMailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to,
        subject,
        html,
        text,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.error || data.details || "Failed to send email";
      onError?.(errorMsg);
      console.error("[sendMail] API error:", data);
      return { success: false, error: errorMsg };
    }

    onSuccess?.();
    return { success: true };
  } catch (err: any) {
    const errorMsg = err.message || "Network error";
    onError?.(errorMsg);
    console.error("[sendMail] Network error:", err);
    return { success: false, error: errorMsg };
  }
}