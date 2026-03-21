/** Server-safe HTML escape (no DOM). Use in API routes. */
export function escapeHtmlServer(text: string): string {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const volunteerRequestProjectManagerHtml = (
  volunteerFirstName: string,
  agencyName: string,
  projectTitle: string,
  applicationLink: string,
  options?: { serverEscape?: boolean }
): string => {
  const safeName =
    options?.serverEscape === true
      ? escapeHtmlServer(volunteerFirstName)
      : (() => {
          if (typeof document === "undefined") return escapeHtmlServer(volunteerFirstName);
          const div = document.createElement("div");
          div.textContent = volunteerFirstName;
          return div.innerHTML;
        })();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Project Manager Volunteer Opportunity – ${agencyName}</title>
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
    .list { padding-left: 24px; margin: 24px 0; }
    .list li { margin-bottom: 16px; position: relative; }
    .list li:before { content: "•"; color: #0ea5e9; font-weight: bold; position: absolute; left: -20px; }
    .accent-box {
      background: #eff6ff;
      border-left: 4px solid #0ea5e9;
      padding: 20px;
      margin: 24px 0;
      border-radius: 8px;
    }
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
      <h1>DiasporaBase</h1>
    </div>

    <div class="content">
      <p class="greeting">Dear ${safeName},</p>

      <p class="message">
        We reviewed your profile on <span class="highlight">DiasporaBase</span> and believe your project management experience makes you an excellent potential fit to help lead one of our priority initiatives.
      </p>

      <p class="message">
        <strong>${agencyName}</strong> is seeking a volunteer <strong>Project Manager</strong> to drive the <strong>${projectTitle}</strong> 
      </p>


      <p class="message">
        <strong>Key responsibilities & requirements:</strong>
      </p>

      <ul class="list">
        <li>End-to-end project coordination: planning, execution, monitoring, and closure</li>
        <li>Comfortable working remotely across time zones with clear, proactive communication</li>
      </ul>

      <p class="message">
        This is a high-visibility, remote volunteer role hosted securely on DiasporaBase. You’ll have a dedicated project workspace, direct access to our internal team, defined deliverables, and full credit/acknowledgment for your contribution in official reports and communications.
      </p>

      <div style="text-align: center;">
        <a href="${applicationLink}" class="cta-button">
          Review Full Scope & Review Request
        </a>
      </div>

      <p class="message">
        If the current timeline or scope isn’t quite right, please reply anyway — we frequently shape new roles around strong candidates and would value your input.
      </p>

      <p class="message">
        Thank you for considering bringing your expertise back to support this national priority.<br />
        We look forward to the possibility of working together.
      </p>

      <p class="message">
        Best regards,<br />
        <strong>${agencyName} Project Delivery Team</strong><br />
        in collaboration with<br />
        <strong>The DiasporaBase Team</strong>
      </p>
    </div>

    <div class="footer">
      <p>© ${new Date().getFullYear()} DiasporaBase. All rights reserved.</p>
      <p>
        Questions? <a href="mailto:support@diasporabase.com">Contact Support</a> • 
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://diasporabase.com"}">diasporabase.com</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
};