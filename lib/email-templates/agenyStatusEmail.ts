// lib/email/templates/agencyStatusEmail.ts

export function getAgencyStatusEmailHtml({
  organization_name,
  isApproved,
  appUrl,
}: {
  organization_name: string;
  isApproved: boolean;
  appUrl: string;
}) {
  const status = isApproved ? "activated" : "deactivated";
  const statusTitle = isApproved ? "Approved" : "Not Approved";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Agency Account Status Update</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { margin: 0; padding: 0; background: #f8fafc; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; }
    .container { max-width: 600px; margin: 32px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 48px 32px; text-align: center; color: white; }
    .header h1 { margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.8px; }
    .header p { margin: 12px 0 0; font-size: 18px; opacity: 0.95; }
    .content { padding: 48px 40px; color: #1e293b; text-align: center; }
    .agency-name { font-size: 26px; font-weight: 700; color: #1e40af; margin: 20px 0 32px; }
    .status-badge { display: inline-flex; align-items: center; gap: 12px; padding: 16px 32px; border-radius: 16px; font-weight: 600; font-size: 18px; text-transform: capitalize; margin: 24px 0; min-width: 280px; }
    .status-activated { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
    .status-deactivated { background: #fef2f2; color: #dc2626; border: 1px solid #fca5a5; }
    .icon { width: 28px; height: 28px; flex-shrink: 0; }
    .message { font-size: 17px; line-height: 1.8; color: #475569; margin: 24px 0; max-width: 500px; margin-left: auto; margin-right: auto; }
    .btn { display: inline-block; background: linear-gradient(to right, #1e40af, #2563eb); color: white; font-weight: 600; font-size: 17px; text-decoration: none; padding: 16px 40px; border-radius: 12px; margin: 32px 0; box-shadow: 0 6px 20px rgba(37, 99, 235, 0.3); transition: all 0.3s ease; }
    .btn:hover { background: linear-gradient(to right, #1e3a8a, #1d4ed8); transform: translateY(-2px); box-shadow: 0 10px 25px rgba(37, 99, 235, 0.4); }
    .footer { background: #f8fafc; padding: 40px 32px; text-align: center; font-size: 14px; color: #64748b; border-top: 1px solid #e2e8f0; }
    .footer a { color: #2563eb; text-decoration: none; font-weight: 500; }
    @media (prefers-color-scheme: dark) {
      body { background: #0f172a; }
      .container { background: #1e293b; box-shadow: 0 10px 40px rgba(0,0,0,0.4); }
      .content { color: #e2e8f0; }
      .message { color: #cbd5e1; }
      .agency-name { color: #60a5fa; }
      .footer { background: #1e293b; color: #94a3b8; border-top-color: #334155; }
      .footer a { color: #60a5fa; }
    }
    @media (max-width: 480px) {
      .container { margin: 16px; border-radius: 12px; }
      .header { padding: 40px 24px; }
      .content { padding: 40px 24px; }
      .status-badge { padding: 14px 24px; font-size: 17px; min-width: auto; }
      .btn { padding: 14px 32px; font-size: 16px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>DiasporaBase</h1>
      <p>Agency Account Status Update</p>
    </div>

    <div class="content">
      <p class="message">Dear Agency Administrator,</p>

      <div class="agency-name">${organization_name}</div>

      <div class="status-badge status-${status}">
        ${isApproved
          ? `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/></svg>`
          : `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/></svg>`
        }
        <strong>${statusTitle}</strong>
      </div>

      ${isApproved
        ? `
        <p class="message"><strong>Congratulations!</strong> Your agency account has been successfully verified and activated.</p>
        <p class="message">You can now create and manage projects, post opportunities, and connect with volunteers from the diaspora.</p>
        <a href="${appUrl}/dashboard/agency" class="btn">Access Your Dashboard</a>
      `
        : `
        <p class="message">Unfortunately, your agency registration was not approved at this time.</p>
        <p class="message">This may be due to incomplete information or not meeting our current criteria.<br/>For clarification or to reapply, please contact our support team.</p>
        <a href="mailto:support@diasporabase.com" class="btn">Contact Support</a>
      `}
    </div>

    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} DiasporaBase. All rights reserved.</p>
      <p>Need help? <a href="mailto:support@diasporabase.com">Contact Support</a> • <a href="${appUrl}">Visit Website</a></p>
      <p style="margin-top: 20px; font-size: 12px; opacity: 0.8;">
        You're receiving this email because an agency account was registered with your email address.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}