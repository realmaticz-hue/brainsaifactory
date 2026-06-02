// =============================================================================
// EMAIL NEWSLETTER — Mailchimp & ConvertKit Integration
// =============================================================================

export type EmailProvider = 'mailchimp' | 'convertkit';

export interface EmailConfig {
  provider: EmailProvider;
  apiKey: string;
  listId?: string;
  audienceId?: string;
}

export interface NewsletterTemplate {
  id: string;
  name: string;
  subject: string;
  preheader: string;
  htmlContent: string;
  textContent: string;
}

export interface SendNewsletterRequest {
  subject: string;
  preheader?: string;
  content: string;
  recipients: 'all' | 'segment' | 'test';
  testEmails?: string[];
  segmentId?: string;
  scheduleTime?: Date;
}

export interface EmailCampaignResult {
  success: boolean;
  campaignId?: string;
  sentCount?: number;
  error?: string;
}

/**
 * Convert blog post to email HTML
 */
export function convertBlogToEmail(
  title: string,
  content: string,
  author?: string,
  logoUrl?: string
): string {
  // Convert Markdown to HTML
  const htmlContent = markdownToEmailHtml(content);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
    .logo { max-width: 150px; margin-bottom: 20px; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; }
    .content { padding: 40px 20px; line-height: 1.6; color: #333333; }
    .content h2 { color: #667eea; margin-top: 30px; }
    .content p { margin: 15px 0; }
    .content a { color: #667eea; text-decoration: none; }
    .content img { max-width: 100%; height: auto; }
    .footer { background: #f7fafc; padding: 30px 20px; text-align: center; color: #718096; font-size: 14px; }
    .button { display: inline-block; background: #667eea; color: #ffffff; padding: 12px 30px; border-radius: 6px; text-decoration: none; margin: 20px 0; }
    @media only screen and (max-width: 600px) {
      .header h1 { font-size: 24px; }
      .content { padding: 20px 15px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${logoUrl ? `<img src="${logoUrl}" alt="Logo" class="logo">` : ''}
      <h1>${title}</h1>
      ${author ? `<p style="color: #ffffff; opacity: 0.9; margin: 10px 0;">By ${author}</p>` : ''}
    </div>

    <div class="content">
      ${htmlContent}
    </div>

    <div class="footer">
      <p>You're receiving this email because you subscribed to our newsletter.</p>
      <p><a href="{{unsubscribe_url}}" style="color: #667eea;">Unsubscribe</a> | <a href="{{preferences_url}}" style="color: #667eea;">Update Preferences</a></p>
      <p style="margin-top: 20px; font-size: 12px; color: #a0aec0;">© ${new Date().getFullYear()} All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Simple Markdown to HTML converter for emails
 */
function markdownToEmailHtml(markdown: string): string {
  let html = markdown;

  // Headers
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

  // Lists
  html = html.replace(/^- (.*?)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*?<\/li>\n?)+/g, '<ul>$&</ul>');

  // Paragraphs
  html = html.split('\n\n').map(p => {
    if (!p.startsWith('<')) {
      return `<p>${p}</p>`;
    }
    return p;
  }).join('\n');

  return html;
}

/**
 * Send via Mailchimp
 */
export async function sendViaMailchimp(
  config: EmailConfig,
  request: SendNewsletterRequest
): Promise<EmailCampaignResult> {
  try {
    if (!config.apiKey || !config.audienceId) {
      throw new Error('Mailchimp API key and audience ID required');
    }

    // Extract data center from API key
    const dc = config.apiKey.split('-')[1];
    const baseUrl = `https://${dc}.api.mailchimp.com/3.0`;

    // Create campaign
    const campaignResponse = await fetch(`${baseUrl}/campaigns`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'regular',
        recipients: {
          list_id: config.audienceId,
          segment_opts: request.segmentId ? { saved_segment_id: request.segmentId } : undefined,
        },
        settings: {
          subject_line: request.subject,
          preview_text: request.preheader || '',
          from_name: 'Newsletter',
          reply_to: 'noreply@example.com',
        },
      }),
    });

    if (!campaignResponse.ok) {
      const error = await campaignResponse.json();
      throw new Error(error.detail || 'Failed to create Mailchimp campaign');
    }

    const campaign = await campaignResponse.json();

    // Set campaign content
    const contentResponse = await fetch(`${baseUrl}/campaigns/${campaign.id}/content`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: request.content,
      }),
    });

    if (!contentResponse.ok) {
      throw new Error('Failed to set campaign content');
    }

    // Send test or schedule/send campaign
    if (request.recipients === 'test' && request.testEmails) {
      await fetch(`${baseUrl}/campaigns/${campaign.id}/actions/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test_emails: request.testEmails,
          send_type: 'html',
        }),
      });

      return {
        success: true,
        campaignId: campaign.id,
        sentCount: request.testEmails.length,
      };
    } else if (request.scheduleTime) {
      // Schedule campaign
      await fetch(`${baseUrl}/campaigns/${campaign.id}/actions/schedule`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schedule_time: request.scheduleTime.toISOString(),
        }),
      });

      return {
        success: true,
        campaignId: campaign.id,
      };
    } else {
      // Send immediately
      await fetch(`${baseUrl}/campaigns/${campaign.id}/actions/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return {
        success: true,
        campaignId: campaign.id,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send via ConvertKit
 */
export async function sendViaConvertKit(
  config: EmailConfig,
  request: SendNewsletterRequest
): Promise<EmailCampaignResult> {
  try {
    if (!config.apiKey) {
      throw new Error('ConvertKit API key required');
    }

    const baseUrl = 'https://api.convertkit.com/v3';

    // Create broadcast
    const response = await fetch(`${baseUrl}/broadcasts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_secret: config.apiKey,
        subject: request.subject,
        content: request.content,
        description: request.preheader || '',
        email_layout_template: 'default',
        send_at: request.scheduleTime?.toISOString(),
        public: false,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create ConvertKit broadcast');
    }

    const result = await response.json();

    return {
      success: true,
      campaignId: result.broadcast.id.toString(),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * A/B test subject lines
 */
export interface ABTestConfig {
  subjectA: string;
  subjectB: string;
  sampleSize: number; // percentage 10-50
  winnerCriteria: 'opens' | 'clicks';
  waitTime: number; // hours
}

export async function createABTest(
  config: EmailConfig,
  request: SendNewsletterRequest,
  abTest: ABTestConfig
): Promise<EmailCampaignResult> {
  if (config.provider === 'mailchimp') {
    try {
      const dc = config.apiKey.split('-')[1];
      const baseUrl = `https://${dc}.api.mailchimp.com/3.0`;

      const response = await fetch(`${baseUrl}/campaigns`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'regular',
          recipients: {
            list_id: config.audienceId,
          },
          settings: {
            subject_line: abTest.subjectA,
          },
          ab_split_opts: {
            split_test: 'subject',
            pick_winner: 'auto',
            wait_time: abTest.waitTime,
            winner_criteria: abTest.winnerCriteria,
            subject_lines_a: abTest.subjectA,
            subject_lines_b: abTest.subjectB,
            send_size: abTest.sampleSize,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create A/B test');
      }

      const campaign = await response.json();

      return {
        success: true,
        campaignId: campaign.id,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  return {
    success: false,
    error: 'A/B testing only supported with Mailchimp',
  };
}

/**
 * Get newsletter templates
 */
export function getNewsletterTemplates(): NewsletterTemplate[] {
  return [
    {
      id: 'weekly-digest',
      name: 'Weekly Digest',
      subject: '📬 Your Weekly Digest: {{topic}}',
      preheader: 'Top stories and insights from this week',
      htmlContent: '',
      textContent: '',
    },
    {
      id: 'product-launch',
      name: 'Product Launch',
      subject: '🚀 Introducing {{product_name}}',
      preheader: 'Something exciting is here!',
      htmlContent: '',
      textContent: '',
    },
    {
      id: 'content-roundup',
      name: 'Content Roundup',
      subject: '📚 Must-Read Articles: {{date}}',
      preheader: 'Handpicked content just for you',
      htmlContent: '',
      textContent: '',
    },
  ];
}
