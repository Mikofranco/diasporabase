export const resetPasswordMail =(resetLink:string )=>{
    return (`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>Reset Your Password</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            body { margin: 0; padding: 0; background: #f8fafc; font-family: 'Inter', sans-serif; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.08); }
            .header { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 48px 32px; text-align: center; color: white; }
            .header h1 { margin: 0; font-size: 32px; font-weight: 700; }
            .header p { margin: 12px 0 0; font-size: 18px; opacity: 0.95; }
            .content { padding: 48px 40px; color: #1e293b; text-align: center; }
            .message { font-size: 17px; line-height: 1.8; color: #475569; margin: 24px 0; max-width: 500px; margin-left: auto; margin-right: auto; }
            .btn {
              display: inline-block;
              background: linear-gradient(to right, #0ea5e9, #0284c7);
              color: white;
              font-weight: 600;
              font-size: 17px;
              text-decoration: none;
              padding: 16px 40px;
              border-radius: 12px;
              margin: 32px 0;
              box-shadow: 0 6px 20px rgba(14, 165, 233, 0.3);
            }
            .btn:hover { background: linear-gradient(to right, #0284c7, #0369a1); }
            .footer { background: #f8fafc; padding: 40px 32px; text-align: center; font-size: 14px; color: #64748b; }
            .footer a { color: #2563eb; text-decoration: none; font-weight: 500; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>DiasporaBase</h1>
              <p>Password Reset Request</p>
            </div>
        
            <div class="content">
              <p class="message">
                We received a request to reset your password for your DiasporaBase account.
              </p>
              <p class="message">
                Click the button below to securely reset your password. This link will expire in 1 hour.
              </p>
        
              <a href="${resetLink}" class="btn">
                Reset Password
              </a>
        
              <p class="message">
                If you didn't request this, you can safely ignore this email — your password will remain unchanged.
              </p>
            </div>
        
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} DiasporaBase. All rights reserved.</p>
              <p>Need help? <a href="mailto:support@diasporabase.com">Contact Support</a></p>
            </div>
          </div>
        </body>
        </html>
        `)
}