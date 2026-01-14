export const taggedInCommentHTML = (
  username: string,
  commenterName: string,
  commentText: string,
  projectTitle: string,
  projectId: string,
  commentLink?: string // optional: direct link to the comment/project
): string => {
  // Basic HTML escaping to prevent injection
  const escapeHtml = (unsafe: string): string => {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const safeUsername = escapeHtml(username);
  const safeCommenter = escapeHtml(commenterName);
  const safeCommentText = escapeHtml(commentText);
  const safeProjectTitle = escapeHtml(projectTitle);

  // Optional fallback link if no direct comment link is provided
  const projectUrl = commentLink ||
    `${process.env.NEXT_PUBLIC_APP_URL || "https://diasporabase.com"}/dashboard/volunteer/projects/${projectId}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You've been mentioned on DiasporaBase</title>
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
    .comment-box {
      background: #f1f5f9;
      border-left: 4px solid #0ea5e9;
      padding: 20px;
      margin: 24px 0;
      border-radius: 8px;
      font-style: italic;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(to right, #0ea5e9, #0284c7);
      color: white !important;
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
      .cta-button { padding: 16px 32px; font-size: 16px; }
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
      <p class="greeting">Hi ${safeUsername},</p>

      <p class="message">
        <span class="highlight">${safeCommenter}</span> mentioned you in a comment on project 
        <strong>"${safeProjectTitle}"</strong>.
      </p>

      <div class="comment-box">
        "${safeCommentText}"
      </div>

      <p class="message">
        Come join the conversation and continue the collaboration!
      </p>

      <div style="text-align: center;">
        <a href="${projectUrl}" class="cta-button">
          View Comment & Project
        </a>
      </div>

      <p class="message" style="font-size: 15px; color: #64748b;">
        This is an automated notification from DiasporaBase.
        You'll receive these when someone mentions you in a project comment.
      </p>

      <p class="message">
        Warm regards,<br />
        <strong>The DiasporaBase Team</strong>
      </p>
    </div>

    <div class="footer">
      <p>© ${new Date().getFullYear()} DiasporaBase. All rights reserved.</p>
      <p>
        Need help? <a href="mailto:support@diasporabase.com">Contact Support</a> • 
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://diasporabase.com"}">Visit Website</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
};