"use server"

import { resetPasswordMail } from "@/lib/email-templates/reset";
import { createAdminClient } from "@/lib/supabase/client";
import { sendMailServer } from "@/services/mail/send-mail-server";

const DEVELOPMENT ="https://localhost:3000"

export async function sendCustomPasswordResetEmail(formData: FormData) {
  const email = formData.get("email") as string;

  // Basic validation
  if (!email) {
    return { success: false, error: "Email is required" };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Please enter a valid email address" };
  }

  const supabaseAdmin = createAdminClient(); 

  try {
    console.log(`Generating reset link for: ${email}`);

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        // redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
        redirectTo: `${DEVELOPMENT}/reset-password`,
      },
    });

    if (error) {
      console.error("Supabase generateLink error:", error);
      throw error;
    }

    if (!data?.properties?.action_link) {
      throw new Error("No action_link returned from Supabase");
    }

    const secureResetLink = data.properties.action_link;

    console.log(`Sending custom email with link: ${secureResetLink}`);

    const result =  await sendMailServer({
      to: email,
      subject: "Reset Your DiasporaBase Password",
      html: resetPasswordMail(secureResetLink),
    });
    console.log("result sending mail from server", result)

  

    return { success: true, secureResetLink};
  } catch (err: any) {
    console.error("Password reset flow failed:", err);
    return {
      success: false,
      error: err.message || "Failed to send password reset email",
    };
  }
}
