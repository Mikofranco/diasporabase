// lib/email/templates/volunteerApplicationStatusHtml.ts

type ApplicationStatus = "accepted" | "declined";

export const volunteerApplicationStatusHtml = (
  volunteerFirstName: string,
  organizationName: string,
  projectId: string,
  status: ApplicationStatus,
  projectTitle?: string,
): string => {

  // Safe HTML escape for server + client
  const escapeHtml = (text: string): string =>
    text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const safeFirstName = escapeHtml(volunteerFirstName);
  const safeOrgName = escapeHtml(organizationName);
  const safeProjectTitle = projectTitle ? escapeHtml(projectTitle) : "the project";

  const projectUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://diasporabase.com"}/dashboard/volunteer/projects/${projectId}`;

  const isAccepted = status === "accepted";

  const pageTitle = isAccepted
    ? "Application Accepted – DiasporaBase"
    : "Application Update – DiasporaBase";

  const greeting = isAccepted
    ? `Congratulations ${safeFirstName}!`
    : `Hello ${safeFirstName},`;

  const mainMessage = isAccepted
    ? `
      <p class="message">
        We’re excited to inform you that <span class="highlight">${safeOrgName}</span> has <strong>accepted your application</strong>.
      </p>
      <p class="message">
        You’re now officially part of <span class="highlight">${safeProjectTitle}</span>.
      </p>
    `
    : `
      <p class="message">
        Thank you for your interest in <span class="highlight">${safeProjectTitle}</span>.
      </p>
      <p class="message">
        After careful review, <span class="highlight">${safeOrgName}</span> has decided <strong>not to move forward with your application</strong> at this time.
      </p>
      <p class="message">
        We truly appreciate the time and effort you put into applying and encourage you to explore other opportunities on DiasporaBase.
      </p>
    `;

  const nextSteps = isAccepted
    ? `
      <p class="message">Next steps:</p>
      <ul class="list">
        <li>Visit the project workspace to review details and timelines</li>
        <li>Introduce yourself to the team</li>
        <li>Start contributing</li>
      </ul>
    `
    : `
      <p class="message">
        Don’t be discouraged — many projects are still looking for volunteers with your skills.
      </p>
    `;

  const ctaButton = isAccepted
    ? `
      <div style="text-align:center;">
        <a href="${projectUrl}" class="cta-button">
          Go to Project Workspace
        </a>
      </div>
    `
    : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${pageTitle}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  body { margin:0; padding:0; background:#f8fafc; font-family:'Inter',sans-serif; }
  .container { max-width:600px; margin:40px auto; background:white; border-radius:16px; overflow:hidden; }
  .header { background:linear-gradient(135deg,#0ea5e9,#0284c7); padding:48px; text-align:center; color:white; }
  .content { padding:40px; color:#1e293b; }
  .greeting { font-size:24px; font-weight:700; }
  .message { font-size:16px; line-height:1.7; color:#475569; }
  .cta-button { display:inline-block; background:#0ea5e9; color:white; padding:16px 32px; border-radius:10px; text-decoration:none; }
  .footer { background:#f1f5f9; padding:24px; text-align:center; font-size:14px; color:#64748b; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>DiasporaBase</h1>
  </div>

  <div class="content">
    <p class="greeting">${greeting}</p>

    ${mainMessage}
    ${nextSteps}
    ${ctaButton}

    <p class="message">
      Warm regards,<br/>
      <strong>The DiasporaBase Team</strong>
    </p>
  </div>

  <div class="footer">
    © ${new Date().getFullYear()} DiasporaBase
  </div>
</div>
</body>
</html>
`;
};
