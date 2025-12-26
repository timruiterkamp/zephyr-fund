import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { firstName, lastName, email, organization, investmentSize, message } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !investmentSize) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return res.status(500).json({ error: 'Email service not configured' });
    }

    // Format the investment interest email
    const emailHtml = `
      <h2>New Investment Interest - Zypher Capital</h2>

      <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Name</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${firstName} ${lastName}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Email</td>
          <td style="padding: 10px; border: 1px solid #ddd;"><a href="mailto:${email}">${email}</a></td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Organization</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${organization || 'Not provided'}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Investment Interest</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${investmentSize}</td>
        </tr>
        ${message ? `
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Message</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${message}</td>
        </tr>
        ` : ''}
      </table>

      <p style="margin-top: 20px; color: #666; font-size: 12px;">
        Submitted at: ${new Date().toISOString()}<br>
        This is an automated message from the Zypher Capital landing page.
      </p>
    `;

    // Send email notification
    const { data, error } = await resend.emails.send({
      from: 'Zypher Capital <noreply@zypher.fund>',
      to: [process.env.NOTIFICATION_EMAIL || 'tim@rfrsh.io'],
      subject: `New Investment Interest: ${firstName} ${lastName} (${investmentSize})`,
      html: emailHtml,
      replyTo: email,
    });

    if (error) {
      console.error('Resend error:', JSON.stringify(error));
      return res.status(500).json({
        error: 'Failed to send notification',
        details: error.message || 'Unknown error'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Thank you for your interest. We will be in touch shortly.',
      id: data?.id
    });

  } catch (error) {
    console.error('Server error:', error.message, error.stack);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}
