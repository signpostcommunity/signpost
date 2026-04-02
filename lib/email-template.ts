// TODO: Migrate notification emails to use the branded React Email template system
// in emails/SignpostEmail.tsx. The current raw HTML approach works but the new
// React Email components provide better maintainability and brand consistency.
// See emails/ directory for the base layout and reusable components.

export interface EmailContentBlock {
  type: 'message_preview' | 'booking_details' | 'rate_details' | 'info_card' | 'warning_card'
  data: Record<string, string>
}

function renderContentBlock(block: EmailContentBlock): string {
  switch (block.type) {
    case 'message_preview': {
      const { senderName, messageBody, timestamp } = block.data
      return `
        <tr>
          <td style="padding: 0 36px;">
            <div style="background:#16161f; border-left:3px solid #00e5ff; padding:16px 20px; border-radius:0 8px 8px 0; margin:16px 0;">
              ${senderName ? `<div style="font-size:13px; color:#96a0b8; margin-bottom:6px;">${senderName}</div>` : ''}
              <div style="font-size:15px; color:#f0f2f8; line-height:1.6;">${messageBody || ''}</div>
              ${timestamp ? `<div style="font-size:12px; color:#5a6178; margin-top:8px;">${timestamp}</div>` : ''}
            </div>
          </td>
        </tr>`
    }

    case 'booking_details': {
      const { title, date, time, location, format, requesterName, interpreterName } = block.data
      const details = [title, `${date || ''}${time ? ' · ' + time : ''}`, location, format].filter(Boolean).join('<br>')
      let extras = ''
      if (requesterName) extras += `<div style="font-size:13px; color:#96a0b8; margin-top:8px;">Requested by ${requesterName}</div>`
      if (interpreterName) extras += `<div style="font-size:13px; color:#96a0b8; margin-top:4px;">Interpreter: ${interpreterName}</div>`
      return `
        <tr>
          <td style="padding: 0 36px;">
            <div style="background:#16161f; border:1px solid #1e2433; border-radius:10px; padding:20px; margin:16px 0;">
              <div style="font-size:13px; color:#00e5ff; text-transform:uppercase; letter-spacing:0.08em; font-weight:600; margin-bottom:12px;">Booking Details</div>
              <div style="font-size:14px; color:#f0f2f8; line-height:1.8;">${details}</div>
              ${extras}
            </div>
          </td>
        </tr>`
    }

    case 'rate_details': {
      const { rate, minHours, cancellationPolicy, interpreterNote } = block.data
      let termsHtml = ''
      if (minHours) termsHtml += `Minimum: ${minHours} hours<br>`
      if (cancellationPolicy) termsHtml += cancellationPolicy
      return `
        <tr>
          <td style="padding: 0 36px;">
            <div style="background:#16161f; border:1px solid #1e2433; border-radius:10px; padding:20px; margin:16px 0;">
              <div style="font-size:13px; color:#00e5ff; text-transform:uppercase; letter-spacing:0.08em; font-weight:600; margin-bottom:12px;">Rate Response</div>
              ${rate ? `<div style="font-size:22px; color:#f0f2f8; font-weight:700; margin-bottom:8px;">${rate}/hr</div>` : ''}
              ${termsHtml ? `<div style="font-size:14px; color:#96a0b8; line-height:1.6;">${termsHtml}</div>` : ''}
              ${interpreterNote ? `<div style="font-size:14px; color:#f0f2f8; margin-top:12px; font-style:italic;">"${interpreterNote}"</div>` : ''}
            </div>
          </td>
        </tr>`
    }

    case 'info_card': {
      const entries = Object.entries(block.data)
      const rows = entries.map(([key, value]) =>
        `<div style="font-size:14px; color:#96a0b8;">${key}</div><div style="font-size:15px; color:#f0f2f8; margin-bottom:8px;">${value}</div>`
      ).join('')
      return `
        <tr>
          <td style="padding: 0 36px;">
            <div style="background:#16161f; border:1px solid #1e2433; border-radius:10px; padding:20px; margin:16px 0;">
              ${rows}
            </div>
          </td>
        </tr>`
    }

    case 'warning_card': {
      const { title, message } = block.data
      return `
        <tr>
          <td style="padding: 0 36px;">
            <div style="background:rgba(255,126,69,0.08); border:1px solid rgba(255,126,69,0.3); border-radius:10px; padding:20px; margin:16px 0;">
              ${title ? `<div style="font-size:14px; color:#ff7e45; font-weight:600; margin-bottom:8px;">${title}</div>` : ''}
              <div style="font-size:14px; color:#f0f2f8; line-height:1.6;">${message || ''}</div>
            </div>
          </td>
        </tr>`
    }

    default:
      return ''
  }
}

export function emailTemplate({
  heading,
  body,
  ctaText,
  ctaUrl,
  preferencesUrl,
  contentBlocks,
}: {
  heading: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
  preferencesUrl?: string;
  contentBlocks?: EmailContentBlock[];
}): string {
  const prefUrl = preferencesUrl || 'https://signpost.community/interpreter/dashboard/profile?tab=account-settings';

  const ctaBlock = ctaText && ctaUrl
    ? `
      <tr>
        <td style="padding: 28px 36px 0;">
          <a href="${ctaUrl}" style="
            display: inline-block;
            background: #00e5ff;
            color: #0a0a0f;
            font-family: 'Helvetica Neue', Arial, sans-serif;
            font-weight: 700;
            font-size: 15px;
            text-decoration: none;
            padding: 12px 28px;
            border-radius: 8px;
          ">${ctaText}</a>
        </td>
      </tr>`
    : '';

  const contentBlocksHtml = contentBlocks?.map(renderContentBlock).join('') || '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${heading}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0f;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="
          max-width: 600px;
          width: 100%;
          background-color: #111118;
          border-radius: 12px;
          border: 1px solid #1e2433;
        ">
          <!-- Wordmark -->
          <tr>
            <td style="padding: 32px 36px 24px; border-bottom: 1px solid #1e2433;">
              <span style="
                font-family: 'Arial Black', 'Helvetica Neue', Arial, sans-serif;
                font-weight: 900;
                font-size: 24px;
                letter-spacing: -0.8px;
                line-height: 1;
              "><span style="color: #ffffff;">sign</span><span style="color: #00e5ff;">post</span></span>

          <!-- Body -->
          <tr>
            <td style="padding: 36px 36px 12px;">
              <h1 style="
                margin: 0 0 20px;
                font-family: 'Helvetica Neue', Arial, sans-serif;
                font-weight: 700;
                font-size: 20px;
                color: #ffffff;
                line-height: 1.3;
              ">${heading}</h1>
              <div style="
                font-family: 'Helvetica Neue', Arial, sans-serif;
                font-size: 15px;
                line-height: 1.65;
                color: #b0b0b0;
              ">${body}</div>
            </td>
          </tr>

          <!-- Content Blocks -->
          ${contentBlocksHtml}

          <!-- CTA -->
          ${ctaBlock}
          ${ctaBlock ? '<tr><td style="padding: 0 36px;"></td></tr>' : ''}

          <!-- Footer -->
          <tr>
            <td style="padding: 36px 36px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid #1e2433;">
                <tr>
                  <td style="padding-top: 24px;">
                    <p style="
                      margin: 0 0 8px;
                      font-family: 'Helvetica Neue', Arial, sans-serif;
                      font-size: 12px;
                      color: #6b7280;
                      line-height: 1.5;
                    ">You're receiving this because you have an account on signpost.</p>
                    <p style="
                      margin: 0 0 8px;
                      font-family: 'Helvetica Neue', Arial, sans-serif;
                      font-size: 12px;
                      line-height: 1.5;
                    "><a href="${prefUrl}" style="color: #00e5ff; text-decoration: none;">Manage your notification preferences &rarr;</a></p>
                    <p style="
                      margin: 0;
                      font-family: 'Helvetica Neue', Arial, sans-serif;
                      font-size: 12px;
                      color: #6b7280;
                    ">signpost.community</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
