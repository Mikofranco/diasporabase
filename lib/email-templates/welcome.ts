export const welcomeHtml = (userName: string, confirmationLink: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Welcome to DiasporaBase!</title>

  <!-- Email-safe fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

  <!-- Font Awesome (lightweight) -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" 
    integrity="sha512-..." crossorigin="anonymous" referrerpolicy="no-referrer" />

  <style>
    /* Reset & Base */
    body {
      margin: 0;
      padding: 0;
      background-color: #f3f4f6;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
      -webkit-text-size-adjust: 100%;
    }
    table {
      border-collapse: collapse;
    }
    a {
      color: inherit;
      text-decoration: none;
    }
    img {
      display: block;
      max-width: 100%;
    }

    /* Hide scrollbars */
    body::-webkit-scrollbar { display: none; }
    body { -ms-overflow-style: none; scrollbar-width: none; }

    /* Button hover effect (email-safe) */
    .cta-button {
      background: linear-gradient(90deg, #1E3A8A, #3B82F6) !important;
      transition: all 0.3s ease;
    }
    .cta-button:hover {
      background: linear-gradient(90deg, #1E40AF, #60A5FA) !important;
    }

    /* Responsive */
    @media only screen and (max-width: 600px) {
      .container {
        width: 100% !important;
        padding: 16px !important;
      }
      .header-title {
        font-size: 24px !important;
      }
      .hero-title {
        font-size: 24px !important;
      }
      .section-title {
        font-size: 18px !important;
      }
      .body-text {
        font-size: 14px !important;
      }
      .cta-button {
        padding: 12px 24px !important;
        font-size: 14px !important;
      }
      .icon-circle {
        width: 32px !important;
        height: 32px !important;
      }
      .feature-icon {
        width: 36px !important;
        height: 36px !important;
        font-size: 14px !important;
      }
    }
  </style>
</head>

<body style="margin:0; padding:24px; background:#f3f4f6;">
  <div class="container" style="max-width: 680px; margin: 0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding:32px; background:linear-gradient(90deg, #1E3A8A, #3B82F6);">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:12px; background:#fff; border-radius:50%;">
                <img src="https://diasporabase.com/icononly_logo.png" alt="DiasporaBase Logo" width="48" height="48" />
              </td>
              <td style="padding-left:16px;">
                <h1 class="header-title" style="margin:0; color:#ffffff; font-size:32px; font-weight:700;">DiasporaBase</h1>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Hero -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding:48px 32px; background:linear-gradient(180deg, #DBEAFE, #FFFFFF);">
          <div style="width:80px; height:80px; background:#10B981; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 16px;">
            <i class="fa-solid fa-check" style="color:#fff; font-size:32px;"></i>
          </div>
          <h2 class="hero-title" style="margin:0 0 12px; color:#111827; font-size:28px; font-weight:700;">
            Welcome to DiasporaBase, ${escapeHtml(userName)}!
          </h2>
          <p class="body-text" style="margin:0; color:#4B5563; font-size:16px; line-height:1.5;">
            Your account is ready. Confirm your email to get started.
          </p>
        </td>
      </tr>
    </table>

    <!-- Content -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td style="padding:32px 48px;">
          
          <!-- Greeting -->
          <p class="body-text" style="margin:0 0 24px; color:#374151; font-size:16px; line-height:1.625;">
            Hi ${escapeHtml(userName)},<br><br>
            Thank you for joining <strong>DiasporaBase</strong>! We're excited to help you connect, collaborate, and make an impact in the diaspora community.
          </p>

          <!-- Features -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb; border-radius:8px; padding:24px; margin-bottom:32px;">
            <tr>
              <td>
                <h3 class="section-title" style="margin:0 0 16px; color:#111827; font-size:18px; font-weight:600;">
                  What You Can Do
                </h3>
                <table cellpadding="0" cellspacing="0">
                  ${[
                    { icon: 'fa-chart-line', color: '#3B82F6', title: 'For Organizations', text: 'Post projects, manage volunteers, and track impact.' },
                    { icon: 'fa-shield-halved', color: '#10B981', title: 'Secure & Private', text: 'Your data is encrypted and protected.' },
                    { icon: 'fa-users', color: '#F59E0B', title: 'Collaborate', text: 'Connect with volunteers and share opportunities.' }
                  ].map(f => `
                  <tr>
                    <td style="padding-bottom:20px; vertical-align:top;">
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding-right:16px;">
                            <div class="feature-icon" style="width:40px; height:40px; background:${f.color}; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                              <i class="${f.icon}" style="color:#fff; font-size:16px;"></i>
                            </div>
                          </td>
                          <td>
                            <h4 style="margin:0 0 4px; color:#111827; font-size:16px; font-weight:500;">${f.title}</h4>
                            <p class="body-text" style="margin:0; color:#4B5563; font-size:14px; line-height:1.5;">${f.text}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  `.trim()).join('')}
                </table>
              </td>
            </tr>
          </table>

          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0" style="text-align:center; margin-bottom:32px;">
            <tr>
              <td>
                <a href="${confirmationLink}" class="cta-button" style="
                  display:inline-block; 
                  background:linear-gradient(90deg, #1E3A8A, #3B82F6); 
                  color:#ffffff; 
                  font-weight:600; 
                  font-size:16px; 
                  padding:14px 32px; 
                  border-radius:8px; 
                  text-decoration:none;
                ">
                  <i class="fa-solid fa-rocket" style="margin-right:8px;"></i>
                  Confirm Your Email
                </a>
                <p class="body-text" style="margin:12px 0 0; color:#4B5563; font-size:14px;">
                  This link expires in 15 minutes.
                </p>
              </td>
            </tr>
          </table>

          <!-- Tips -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(90deg, rgba(245,158,11,0.1), #FEF3C7); border-radius:8px; padding:24px; margin-bottom:32px;">
            <tr>
              <td>
                <h3 class="section-title" style="margin:0 0 16px; color:#111827; font-size:18px; font-weight:600; display:flex; align-items:center;">
                  <i class="fa-solid fa-lightbulb" style="color:#F59E0B; margin-right:8px;"></i>
                  Quick Tips
                </h3>
                <ul style="margin:0; padding-left:20px; color:#374151; list-style:none;">
                  <li style="margin-bottom:12px; display:flex; font-size:14px; line-height:1.5;">
                    <i class="fa-solid fa-arrow-right" style="color:#F59E0B; margin-right:8px; margin-top:2px; font-size:12px; flex-shrink:0;"></i>
                    <span>Complete your profile to unlock all features</span>
                  </li>
                  <li style="margin-bottom:12px; display:flex; font-size:14px; line-height:1.5;">
                    <i class="fa-solid fa-arrow-right" style="color:#F59E0B; margin-right:8px; margin-top:2px; font-size:12px; flex-shrink:0;"></i>
                    <span>Post your first project to attract volunteers</span>
                  </li>
                  <li style="display:flex; font-size:14px; line-height:1.5;">
                    <i class="fa-solid fa-arrow-right" style="color:#F59E0B; margin-right:8px; margin-top:2px; font-size:12px; flex-shrink:0;"></i>
                    <span>Join our community for updates and support</span>
                  </li>
                </ul>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>

    <!-- Footer -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6; padding:24px 32px; text-align:center;">
      <tr>
        <td>
          <p class="body-text" style="margin:0 0 16px; color:#374151; font-size:14px;">
            Follow us for updates:
          </p>
          <table align="center" cellpadding="0" cellspacing="0">
            <tr>
              ${['twitter', 'linkedin', 'github'].map(s => `
              <td style="padding:0 6px;">
                <a href="https://${s}.com" style="
                  display:flex; width:40px; height:40px; border-radius:50%; 
                  align-items:center; justify-content:center; color:#fff;
                  background:${s === 'twitter' ? '#1DA1F2' : s === 'linkedin' ? '#0A66C2' : '#111827'};
                  transition:background 0.3s ease;
                " onmouseover="this.style.background='${s === 'twitter' ? '#0d95e8' : s === 'linkedin' ? '#0a5bb5' : '#333'}'" 
                  onmouseout="this.style.background='${s === 'twitter' ? '#1DA1F2' : s === 'linkedin' ? '#0A66C2' : '#111827'}'">
                  <i class="fa-brands fa-${s}"></i>
                </a>
              </td>
              `.trim()).join('')}
            </tr>
          </table>
          <div style="border-top:1px solid #e5e7eb; margin-top:24px; padding-top:24px;">
            <p class="body-text" style="margin:0 0 8px; color:#4B5563; font-size:14px;">
              © 2025 DiasporaBase. All rights reserved.
            </p>
            <p style="margin:0; color:#6B7280; font-size:12px;">
              <a href="#" style="color:#3B82F6; text-decoration:none;">Privacy</a> • 
              <a href="#" style="color:#3B82F6; text-decoration:none;">Terms</a> • 
              <a href="#" style="color:#3B82F6; text-decoration:none;">Unsubscribe</a>
            </p>
          </div>
        </td>
      </tr>
    </table>

  </div>
</body>
</html>
`;

// Helper: Prevent XSS in user input
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}