// lib/email.ts
import nodemailer from "nodemailer";

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) ,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  try {
    const sendMailResponse = await transporter.sendMail({
      from: `"DiasporaBase" <${process.env.SMTP_FROM}>`,
      to,
      subject,
      text,
      html,
    });

    console.log('Email sent successfully:', sendMailResponse);
  } catch (error: any) {
    const smtpError = error as any;

    let userMessage = "Failed to send email";

    if (smtpError.code === "EAUTH") {
      userMessage =
        "SMTP Authentication failed. Check SMTP_USER and SMTP_PASS.";
    } else if (smtpError.code === "ECONNECTION") {
      userMessage = `Cannot connect to SMTP server: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}. Check host, port, and firewall.`;
    } else if (smtpError.code === "ETIMEDOUT") {
      userMessage =
        "SMTP connection timed out. Server may be down or blocking connection.";
    } else if (smtpError.response) {
      userMessage = `SMTP server rejected: ${smtpError.response} (${smtpError.responseCode})`;
    } else if (smtpError.message) {
      userMessage = smtpError.message;
    }


    // console.error("SMTP Error Details:", {
    //   code: smtpError.code,
    //   response: smtpError.response,
    //   responseCode: smtpError.responseCode,
    //   command: smtpError.command,
    //   message: smtpError.message,
    // });

    throw new Error(userMessage);
  }
}
