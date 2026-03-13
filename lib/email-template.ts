export function emailTemplate({
  heading,
  body,
  ctaText,
  ctaUrl,
  preferencesUrl,
}: {
  heading: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
  preferencesUrl?: string;
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
                font-family: 'Helvetica Neue', Arial, sans-serif;
                font-weight: 800;
                font-size: 22px;
                letter-spacing: -0.5px;
              "><span style="color: #ffffff;">sign</span><span style="color: #00e5ff;">post</span></span>
            </td>
          </tr>

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
                    "><a href="${prefUrl}" style="color: #00e5ff; text-decoration: none;">Update your notification preferences &rarr;</a></p>
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
