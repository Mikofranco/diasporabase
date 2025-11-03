// app/api/send-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, text } = await request.json();

    if (!to || !subject || (!html && !text)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // @ts-ignore 
    await sendEmail({ to, subject, html, text });

    return NextResponse.json({ message: 'Email sent successfully' });
  } catch (error: any) {
    console.error('Email send failed:', {
      message: error.message,
      code: error.code,
      response: error.response?.body,
    });
    return NextResponse.json(
      { error: 'Failed to send email', details: error.message },
      { status: 500 }
    );
  }
}