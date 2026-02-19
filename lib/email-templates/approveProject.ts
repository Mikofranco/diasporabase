/** Server-safe HTML escape (no DOM). Use in API routes. */
export function escapeHtmlServer(text: string): string {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
export const projectApprovedHtml = (
  agencyName: string,
  projectTitle: string,
  projectUrl: string,
  supportEmail: string = "support@diasporabase.com",
  appUrl: string = process.env.NEXT_PUBLIC_APP_URL || "https://diasporabase.com",
  options?: { serverEscape?: boolean }
): string => {
  const safeAgencyName =
    options?.serverEscape === true
      ? escapeHtmlServer(agencyName)
      : (() => {
          if (typeof document === "undefined") return escapeHtmlServer(agencyName);
          const div = document.createElement("div");
          div.textContent = agencyName;
          return div.innerHTML;
        })();

  const safeProjectTitle =
    options?.serverEscape === true
      ? escapeHtmlServer(projectTitle)
      : (() => {
          if (typeof document === "undefined") return escapeHtmlServer(projectTitle);
          const div = document.createElement("div");
          div.textContent = projectTitle;
          return div.innerHTML;
        })();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Project Approved - DiasporaBase</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { margin: 0; padding: 0; background: #f8fafc; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 48px 32px; text-align: center; color: white; }
    .header h1 { margin: 0; font-size: 36px; font-weight: 700; letter-spacing: -0.8px; }
    .logo { width: 64px; height: 64px; margin-bottom: 16px; background: white; border-radius: 50%; padding: 12px; }
    .content { padding: 48px 40px; color: #1e293b; }
    .greeting { font-size: 24px; font-weight: 700; margin-bottom: 24px; }
    .message { font-size: 17px; line-height: 1.8; color: #475569; margin: 20px 0; }
    .highlight { color: #1e40af; font-weight: 600; }
    .cta-button {
      display: inline-block;
      background: linear-gradient(to right, #10b981, #059669);
      color: white !important;
      font-weight: 600;
      font-size: 18px;
      text-decoration: none;
      padding: 18px 48px;
      border-radius: 12px;
      margin: 32px 0;
      box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3);
    }
    .cta-button:hover { background: linear-gradient(to right, #059669, #047857); }
    .footer { background: #f8fafc; padding: 40px 32px; text-align: center; font-size: 14px; color: #64748b; border-top: 1px solid #e2e8f0; }
    .footer a { color: #2563eb; text-decoration: none; font-weight: 500; }
    @media (max-width: 480px) {
      .container { margin: 16px; border-radius: 12px; }
      .header { padding: 40px 24px; }
      .content { padding: 40px 24px; }
      .cta-button { padding: 16px 32px; font-size: 16px; }
      .logo { width: 48px; height: 48px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://jbgnohxjwrvepqnlpccy.supabase.co/storage/v1/object/public/app_images/logo.svg" alt="DiasporaBase Logo" class="logo" />
      <h1>Project Approved!</h1>
    </div>

    <div class="content">
      <p class="greeting">Hi ${safeAgencyName},</p>

      <p class="message">
        Great news — your project <span class="highlight">"${safeProjectTitle}"</span> has been <strong>approved</strong>!
      </p>

      <p class="message">
        Our team reviewed your submission and confirmed it meets our quality and scope guidelines. It is now visible to diaspora professionals who have the right skills and availability.
      </p>

      <p class="message">
        What happens next:
      </p>

      <ul class="list" style="padding-left: 24px; margin: 24px 0;">
        <li>Volunteers can now view and apply to your project</li>
        <li>You’ll receive notifications when applications come in</li>
        <li>You can review, interview, and select volunteers directly in your project workspace</li>
        <li>Once matched, you’ll collaborate through built-in tools (milestones, comments, updates)</li>
      </ul>

      <div style="text-align: center;">
        <a href="${projectUrl}" class="cta-button">
          View & Manage Your Project
        </a>
      </div>

      <p class="message">
        Thank you for bringing meaningful work to the diaspora community — we’re excited to see the impact this project will create.
      </p>

      <p class="message">
        If you need any assistance during the matching or delivery phase, just reply to this email.
      </p>

      <p class="message">
        Warmly,<br />
        <strong>The DiasporaBase Team</strong>
      </p>
    </div>

    <div class="footer">
      <p>© ${new Date().getFullYear()} DiasporaBase. All rights reserved.</p>
      <p>
        Need help? <a href="mailto:${supportEmail}">Contact Support</a> • 
        <a href="${appUrl}">Visit Website</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
};