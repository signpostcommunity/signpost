import { Resend } from 'resend';

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const resend = getResend();
  if (!resend) {
    console.warn('RESEND_API_KEY not set, skipping email');
    return;
  }

  try {
    await resend.emails.send({
      from: 'signpost <notifications@signpost.community>',
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error('Email send failed:', error);
  }
}
