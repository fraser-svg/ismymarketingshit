import { Resend } from "resend";

function getResendClient(): Resend {
  return new Resend(process.env.RESEND_API_KEY);
}

interface ReportEmailParams {
  to: string;
  domain: string;
  mirrorLine: string;
  score: number;
  reportUrl: string;
  keyFindings: string[];
}

export async function sendReportEmail(
  params: ReportEmailParams,
): Promise<{ success: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[send-email] RESEND_API_KEY not set, skipping email");
    console.log(`[send-email] Would send to ${params.to}: ${params.reportUrl}`);
    return { success: true };
  }

  try {
    const client = getResendClient();
    await client.emails.send({
      from: "Voice Gap Analysis <reports@deanwiseman.com>",
      to: params.to,
      subject: "Your Voice Gap Analysis is ready",
      html: buildEmailHtml(params),
    });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[send-email] Failed:", message);
    return { success: false, error: message };
  }
}

interface ErrorEmailParams {
  to: string;
  domain: string;
  reason: string;
}

export async function sendErrorEmail(
  params: ErrorEmailParams,
): Promise<{ success: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[send-error-email] RESEND_API_KEY not set, skipping email");
    console.log(
      `[send-error-email] Would send error to ${params.to} for ${params.domain}: ${params.reason}`,
    );
    return { success: true };
  }

  try {
    const client = getResendClient();
    await client.emails.send({
      from: "Voice Gap Analysis <reports@deanwiseman.com>",
      to: params.to,
      subject: `We couldn't complete your Voice Gap Analysis`,
      html: buildErrorEmailHtml(params),
    });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[send-error-email] Failed:", message);
    return { success: false, error: message };
  }
}

function buildErrorEmailHtml(params: ErrorEmailParams): string {
  const safeDomain = escapeHtml(params.domain);
  const safeReason = escapeHtml(params.reason);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Voice Gap Analysis</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">

  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
    We couldn&#8217;t complete your analysis for ${safeDomain}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f9fafb;">
    <tr>
      <td align="center" style="padding: 32px 16px;">

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 4px;">

          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; border-bottom: 1px solid #e5e7eb;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; line-height: 18px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
                    Voice Gap Analysis
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 4px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 18px; line-height: 24px; font-weight: 600; color: #111827;">
                    ${safeDomain}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px; color: #111827; padding-bottom: 16px;">
                    We couldn&rsquo;t complete your Voice Gap Analysis for <strong>${safeDomain}</strong>.
                  </td>
                </tr>
                <tr>
                  <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 24px; color: #374151; padding-bottom: 24px;">
                    ${safeReason}
                  </td>
                </tr>
                <tr>
                  <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 24px; color: #374151;">
                    If you&rsquo;d like to try again or have questions, simply reply to this email.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="border-top: 1px solid #e5e7eb; height: 1px; font-size: 1px; line-height: 1px;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px 32px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; line-height: 18px; color: #9ca3af;">
                    You received this because you requested a Voice Gap Analysis for ${safeDomain}.
                    This is a one-time email. No further messages will be sent unless you request another analysis.
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

function scoreColour(score: number): string {
  if (score < 40) return "#dc2626";
  if (score <= 70) return "#d97706";
  return "#16a34a";
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildEmailHtml(params: ReportEmailParams): string {
  const { domain, mirrorLine, score, reportUrl, keyFindings } = params;
  const colour = scoreColour(score);
  const preheader = escapeHtml(mirrorLine.slice(0, 90));
  const safeDomain = escapeHtml(domain);
  const safeMirrorLine = escapeHtml(mirrorLine);

  const findingRows = keyFindings
    .map(
      (f) => `
      <tr>
        <td style="padding: 0 0 8px 0; font-size: 15px; line-height: 22px; color: #374151;">
          &bull;&nbsp; ${escapeHtml(f)}
        </td>
      </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Your Voice Gap Analysis</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">

  <!-- Preheader (hidden text for inbox preview) -->
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
    ${preheader}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;
  </div>

  <!-- Outer wrapper -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f9fafb;">
    <tr>
      <td align="center" style="padding: 32px 16px;">

        <!-- Inner container -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 4px;">

          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; border-bottom: 1px solid #e5e7eb;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; line-height: 18px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
                    Voice Gap Analysis
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 4px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 18px; line-height: 24px; font-weight: 600; color: #111827;">
                    ${safeDomain}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Mirror Line -->
          <tr>
            <td style="padding: 32px 32px 24px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="font-family: Georgia, 'Times New Roman', Times, serif; font-size: 20px; line-height: 30px; color: #111827; font-style: italic;">
                    &ldquo;${safeMirrorLine}&rdquo;
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Score -->
          <tr>
            <td style="padding: 0 32px 28px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f9fafb; border-radius: 4px;">
                <tr>
                  <td style="padding: 16px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 22px; color: #374151;">
                    Your messaging clarity score:
                    <span style="font-weight: 700; font-size: 22px; color: ${colour};">${score}</span><span style="font-size: 14px; color: #6b7280;">/100</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Key Findings -->
          <tr>
            <td style="padding: 0 32px 28px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding-bottom: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; line-height: 18px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
                    Key findings
                  </td>
                </tr>
                ${findingRows}
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 32px 32px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 0;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${reportUrl}" style="height:48px;v-text-anchor:middle;width:280px;" arcsize="8%" fillcolor="#2563eb">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:600;">View your full report</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="${reportUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; line-height: 48px; text-align: center; text-decoration: none; border-radius: 4px; padding: 0 32px; -webkit-text-size-adjust: none;">
                      View your full report
                    </a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="border-top: 1px solid #e5e7eb; height: 1px; font-size: 1px; line-height: 1px;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px 32px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 22px; color: #374151; padding-bottom: 16px;">
                    Want to talk about what this means?
                    <a href="https://deanwiseman.com/contact" target="_blank" style="color: #2563eb; text-decoration: underline;">Book a conversation</a> with Dean &amp; Wiseman.
                  </td>
                </tr>
                <tr>
                  <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; line-height: 18px; color: #9ca3af;">
                    You received this because you requested a Voice Gap Analysis for ${safeDomain}.
                    This is a one-time email. No further messages will be sent unless you request another analysis.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
        <!-- /Inner container -->

      </td>
    </tr>
  </table>
  <!-- /Outer wrapper -->

</body>
</html>`;
}
