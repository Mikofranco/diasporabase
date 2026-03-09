// app/api/send-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

/**
 * Internal-only endpoint. Call only from server code with INTERNAL_API_SECRET header.
 * Prevents arbitrary users from sending email through your app.
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-internal-secret");
  const expected = process.env.INTERNAL_API_SECRET;
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { to, subject, html, text } = body ?? {};

    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject, and html or text" },
        { status: 400 }
      );
    }

    await sendEmail({ to, subject, html, text });

    return NextResponse.json({ message: "Email sent successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Email send failed:", { message });
    return NextResponse.json(
      { error: "Failed to send email", details: message },
      { status: 500 }
    );
  }
}