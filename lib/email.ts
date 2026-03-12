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
}): Promise<{ id: string } | null> {
  const resend = getResend();
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set, skipping email');
    return null;
  }

  console.log(`[email] calling resend.emails.send() to=${to} subject="${subject}"`);

  const { data, error } = await resend.emails.send({
    from: 'signpost <noreply@send.signpost.community>',
    to,
    subject,
    html,
  });

  if (error) {
    console.error(`[email] Resend API error: ${error.message}`);
    throw new Error(`Resend error: ${error.message}`);
  }

  console.log(`[email] Resend API success, id=${data?.id}`);
  return data ?? null;
}
