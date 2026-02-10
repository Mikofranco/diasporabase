// lib/email/templates/agencyStatusEmail.ts

export function getAgencyStatusEmailHtml({
  organization_name,
  isApproved,
  appUrl,
}: {
  organization_name: string;
  isApproved: boolean;
  appUrl: string;
}): string {
  // Safely escape organization name to prevent XSS in HTML
  const escapeHtml = (text: string): string => {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  };

  const safeOrgName = escapeHtml(organization_name);
  const statusClass = isApproved ? "activated" : "deactivated";
  const statusText = isApproved ? "Approved" : "Not Approved";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Agency Account ${isApproved ? "Approved" : "Update"} – DiasporaBase</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { margin: 0; padding: 0; background: #f8fafc; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 48px 32px; text-align: center; color: white; }
    .header h1 { margin: 0; font-size: 36px; font-weight: 700; letter-spacing: -0.8px; }
    .logo {
      width: 64px;
      height: 64px;
      margin: 0 auto 16px;
      background: white;
      border-radius: 50%;
      padding: 12px;
      box-sizing: border-box;
      object-fit: cover;
      display: block;
    }
    .content { padding: 48px 40px; color: #1e293b; }
    .greeting { font-size: 24px; font-weight: 700; margin-bottom: 24px; }
    .message { font-size: 17px; line-height: 1.8; color: #475569; margin: 20px 0; }
    .highlight { color: #1e40af; font-weight: 600; }
    .org-name { font-size: 26px; font-weight: 700; color: #1e40af; text-align: center; margin: 32px 0; }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      padding: 16px 40px;
      border-radius: 999px;
      font-size: 18px;
      font-weight: 600;
      text-transform: capitalize;
      margin: 24px auto;
    }
    .status-activated { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
    .status-deactivated { background: #fef2f2; color: #dc2626; border: 1px solid #fca5a5; }
    .cta-button {
      display: inline-block;
      background: linear-gradient(to right, #0ea5e9, #0284c7);
      color: white;
      font-weight: 600;
      font-size: 18px;
      text-decoration: none;
      padding: 18px 48px;
      border-radius: 12px;
      margin: 32px 0;
      box-shadow: 0 6px 20px rgba(14, 165, 233, 0.3);
    }
    .cta-button:hover { background: linear-gradient(to right, #0284c7, #0369a1); }
    .footer { background: #f8fafc; padding: 40px 32px; text-align: center; font-size: 14px; color: #64748b; border-top: 1px solid #e2e8f0; }
    .footer a { color: #2563eb; text-decoration: none; font-weight: 500; }
    @media (max-width: 480px) {
      .container { margin: 16px; border-radius: 12px; }
      .header { padding: 40px 24px; }
      .content { padding: 40px 24px; }
      .logo { width: 48px; height: 48px; padding: 8px; }
      .cta-button { padding: 16px 32px; font-size: 16px; }
      .status-badge { padding: 14px 28px; font-size: 17px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img 
        src="https://jbgnohxjwrvepqnlpccy.supabase.co/storage/v1/object/public/app_images/logo.svg" 
        alt="DiasporaBase Logo" 
        class="logo" 
        width="64" 
        height="64"
      />
      <h1>DiasporaBase</h1>
    </div>

    <div class="content">
      <p class="greeting">Hi there,</p>

      <p class="message">
        Your agency account <span class="highlight">${safeOrgName}</span> has been reviewed.
      </p>

      <div class="status-badge status-${statusClass}">
        ${isApproved 
          ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`
          : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>`
        }
        ${statusText}
      </div>

      ${isApproved ? `
        <p class="message">
          <strong>Congratulations!</strong> Your account is now <span class="highlight">active</span>.
        </p>
        <p class="message">
          You can start posting projects, defining needed skills, setting timelines, and connecting with talented diaspora professionals right away.
        </p>
        <div style="text-align: center;">
          <a href="${appUrl}/agency/dashboard" class="cta-button">
            Go to Your Dashboard
          </a>
        </div>
      ` : `
        <p class="message">
          Unfortunately, your agency account was <span class="highlight">not approved</span> at this time.
        </p>
        <p class="message">
          Common reasons include incomplete information, verification issues, or not meeting current platform criteria.
        </p>
        <p class="message">
          Feel free to reply to this email or contact support — we’re happy to explain the decision and guide you on next steps (including re-applying if appropriate).
        </p>
        <div style="text-align: center;">
          <a href="mailto:support@diasporabase.com" class="cta-button">
            Contact Support
          </a>
        </div>
      `}

      <p class="message" style="margin-top: 48px;">
        Thank you for choosing DiasporaBase.<br />
        We’re here to support impactful public-sector work across Africa.
      </p>

      <p class="message">
        Warmly,<br />
        <strong>The DiasporaBase Team</strong>
      </p>
    </div>

    <div class="footer">
      <p>© ${new Date().getFullYear()} DiasporaBase. All rights reserved.</p>
      <p>
        Need help? <a href="mailto:support@diasporabase.com">Contact Support</a> • 
        <a href="${appUrl}">Visit Website</a>
      </p>
      <p style="margin-top: 16px; font-size: 13px; opacity: 0.8;">
        You're receiving this because an agency was registered with this email.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}