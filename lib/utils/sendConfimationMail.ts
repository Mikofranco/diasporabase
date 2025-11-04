// utils/sendConfirmationEmailWithBrevo.ts
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

// Your full HTML template (cleaned, dynamic)
const CONFIRMATION_TEMPLATE = (name: string, url: string) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js"></script>
</head>
<body style="font-family:'Roboto',sans-serif;background:#F3F4F6;margin:0;padding:24px;">
  <div style="max-width:700px;margin:auto;background:#FFF;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.1);overflow:hidden;">
    <!-- Header -->
    <div style="background:linear-gradient(90deg,#1E3A8A,#3B82F6);padding:32px;text-align:center;">
      <div style="display:flex;align-items:center;justify-content:center;gap:16px;">
        <div style="background:#FFF;border-radius:50%;padding:12px;">
          <img src="https://diasporabase.com/icononly_logo.png" alt="Logo" style="width:48px;height:48px;" />
        </div>
        <h1 style="color:#FFF;font-size:32px;font-weight:700;margin:0;">DiasporaBase</h1>
      </div>
    </div>

    <!-- Hero -->
    <div style="background:linear-gradient(180deg,#DBEAFE,#FFF);padding:48px 32px;text-align:center;">
      <div style="background:#10B981;border-radius:50%;width:80px;height:80px;display:flex;align-items:center;justify-content:center;margin:auto auto 16px;">
        <i class="fa-solid fa-check" style="color:#FFF;font-size:32px;"></i>
      </div>
      <h2 style="font-size:28px;font-weight:700;color:#111827;margin:0 0 12px;">Welcome, ${name}!</h2>
      <p style="color:#4B5563;font-size:16px;margin:0;">Click below to confirm your email.</p>
    </div>

    <!-- CTA -->
    <div style="padding:32px 48px;text-align:center;">
      <a href="${url}" style="
        display:inline-block;background:linear-gradient(90deg,#1E3A8A,#3B82F6);color:#FFF;
        font-size:16px;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;
      ">
        <i class="fa-solid fa-rocket" style="margin-right:8px;"></i> Confirm Email
      </a>
      <p style="color:#4B5563;font-size:14px;margin:12px 0 0;">Click to access your dashboard</p>
    </div>

    <!-- Footer -->
    <div style="background:#F3F4F6;padding:24px 32px;text-align:center;">
      <p style="color:#6B7280;font-size:12px;margin:0;">© 2025 DiasporaBase. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

/**
 * Sends confirmation email via Brevo (bypasses Supabase rate limit)
 */
export async function sendConfirmationEmailWithBrevo(
  email: string,
  fullName: string,
  redirectTo?: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  const supabase = createClient();
  const origin = typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL || "";
  const finalRedirect = redirectTo || `${origin}/onboarding`;

  try {
    // 1. Get confirmation URL from Supabase
    const { data, error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: finalRedirect },
    });

    if (error) throw error;

    const confirmationUrl = (data as any)?.confirmation_url;
    if (!confirmationUrl) throw new Error("No confirmation URL from Supabase");

    // 2. Send via your Brevo API route
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: email,
        subject: "Confirm Your DiasporaBase Account",
        html: CONFIRMATION_TEMPLATE(fullName.split(" ")[0], confirmationUrl),
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to send via Brevo");
    }

    return { success: true, url: confirmationUrl };
  } catch (err: any) {
    console.error("Brevo email error:", err);
    return { success: false, error: err.message };
  }
}