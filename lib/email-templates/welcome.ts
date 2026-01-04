export const welcomeHtml = (
  firstName: string,
  confirmationLink: string
): string => {
  // Safely escape the first name
  const escapeHtml = (text: string): string => {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  };

  const safeFirstName = escapeHtml(firstName);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to DiasporaBase!</title>
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
      <p class="greeting">Hi ${safeFirstName},</p>

      <p class="message">
        Thank you for joining <span class="highlight">DiasporaBase</span> — we’re excited to have you in the community!
      </p>

      <p class="message">
        DiasporaBase connects diaspora-based professionals with public institutions across Africa that need skilled support on real, scoped projects (remotely).
      </p>

      <p class="message">
        To get started (2–3 minutes):
      </p>

      <ul class="list">
        <li>Complete your profile (skills, country you want to support, availability)</li>
        <li>Turn on notifications so you don’t miss matches</li>
        <li>Browse opportunities and apply when you see a fit</li>
      </ul>

      <p class="message">
        Once your profile is set, you’ll start seeing projects that match your expertise. If you ever need help, just reply to this email or visit our Help Center.
      </p>

      <div style="text-align: center;">
        <a href="${confirmationLink}" class="cta-button">
          Confirm Your Email & Get Started
        </a>
      </div>

      <p class="message">
        Welcome aboard, we can’t wait to see the impact you’ll make.
      </p>

      <p class="message">
        Warmly,<br />
        <strong>The DiasporaBase Team</strong>
      </p>
    </div>

    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} DiasporaBase. All rights reserved.</p>
      <p>
        Need help? <a href="mailto:support@diasporabase.com">Contact Support</a> • 
        <a href="${
          process.env.NEXT_PUBLIC_APP_URL || "https://diasporabase.com"
        }">Visit Website</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
};

export const welcomeHtmlAgency = (
  firstName: string,
  confirmationLink: string
): string => {
  // Safely escape the first name
  const escapeHtml = (text: string): string => {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  };

  const safeFirstName = escapeHtml(firstName);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to DiasporaBase!</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { margin: 0; padding: 0; background: #f8fafc; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 48px 32px; text-align: center; color: white; }
    .header h1 { margin: 0; font-size: 36px; font-weight: 700; letter-spacing: -0.8px; }
    .logo { width: 64px; height: 64px; margin-bottom: 16px; background-color: white; border-radius: 50%; padding: 8px; }
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
      <p class="greeting">Hi ${safeFirstName},</p>

      <p class="message">
       Thank you for registering your institution on DiasporaBase — we’re glad you’re here.
      </p>

      <p class="message">
        DiasporaBase helps ministries, agencies, and public programs connect with skilled diaspora professionals who can support priority projects, often remotely.
      </p>

      <p class="message">
       Next steps (quick):
      </p>

      <ul class="list">
        <li>Complete your institution profile (official contact, department/unit, country)</li>
        <li>Submit your first project request with clear scope, timeline, and needed skills</li>
      </ul>

      <p class="message">
        Our team will review and verify your account so you can begin matching with volunteers

Once verified, you’ll be able to post opportunities, review volunteer matches, and collaborate through a project workspace.
      </p>

      <div style="text-align: center;">
        <a href="${confirmationLink}" class="cta-button">
          Confirm Your Email & Get Started
        </a>
      </div>

      <p class="message">
        If you’d like, reply with your project idea and we can help you scope it for the best matches.
      </p>

      <p class="message">
        Warmly,<br />
        <strong>The DiasporaBase Team</strong>
      </p>
    </div>

    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} DiasporaBase. All rights reserved.</p>
      <p>
        Need help? <a href="mailto:support@diasporabase.com">Contact Support</a> • 
        <a href="${
          process.env.NEXT_PUBLIC_APP_URL || "https://diasporabase.com"
        }">Visit Website</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
};
