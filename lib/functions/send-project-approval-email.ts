// Deno Edge Function (save in Supabase Functions)
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';
import { Resend } from 'https://esm.sh/resend@3.2.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY')); // Set RESEND_API_KEY in Supabase environment variables

serve(async (req) => {
  try {
    const { email, projectTitle, organizationName } = await req.json();

    await resend.emails.send({
      from: 'no-reply@yourdomain.com', // Replace with your verified domain
      to: email,
      subject: `Your Project "${projectTitle}" Has Been Approved`,
      html: `
        <h1>Project Approval Notification</h1>
        <p>Dear ${organizationName},</p>
        <p>We are pleased to inform you that your project <strong>${projectTitle}</strong> has been approved and is now active.</p>
        <p>Thank you for your contribution!</p>
        <p>Best regards,<br>Your Platform Team</p>
      `,
    });

    return new Response(JSON.stringify({ message: 'Email sent successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});