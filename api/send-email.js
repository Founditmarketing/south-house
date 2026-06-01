const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async function handler(req, res) {
  // ── Only allow POST ──
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Parse & validate body ──
  const { name, email, phone, service, message } = req.body || {};

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required.' });
  }
  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'Email is required.' });
  }
  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  // ── Build the email ──
  const serviceLabel = service && service.trim() ? service.trim() : 'Not specified';
  const phoneLabel = phone && phone.trim() ? phone.trim() : 'Not provided';

  const htmlBody = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f1218; color: #e8e6e1; border: 1px solid rgba(201,169,110,0.15); border-radius: 4px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #c9a96e, #e8d5a8); padding: 24px 32px;">
        <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #0a0c10; letter-spacing: 0.05em;">New Inquiry — SouthHouse CPA</h1>
      </div>
      <div style="padding: 32px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(201,169,110,0.1); color: #a8a39e; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; width: 120px; vertical-align: top;">Name</td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(201,169,110,0.1); color: #e8e6e1; font-size: 15px;">${escapeHtml(name.trim())}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(201,169,110,0.1); color: #a8a39e; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; vertical-align: top;">Email</td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(201,169,110,0.1); color: #c9a96e; font-size: 15px;"><a href="mailto:${escapeHtml(email.trim())}" style="color: #c9a96e; text-decoration: none;">${escapeHtml(email.trim())}</a></td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(201,169,110,0.1); color: #a8a39e; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; vertical-align: top;">Phone</td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(201,169,110,0.1); color: #e8e6e1; font-size: 15px;">${escapeHtml(phoneLabel)}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(201,169,110,0.1); color: #a8a39e; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; vertical-align: top;">Service</td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(201,169,110,0.1); color: #e8e6e1; font-size: 15px;">${escapeHtml(serviceLabel)}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; color: #a8a39e; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; vertical-align: top;">Message</td>
            <td style="padding: 12px 0; color: #e8e6e1; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">${escapeHtml(message.trim())}</td>
          </tr>
        </table>
      </div>
      <div style="padding: 16px 32px; background: rgba(201,169,110,0.04); border-top: 1px solid rgba(201,169,110,0.1); text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #6b6560; letter-spacing: 0.05em;">This message was sent from the SouthHouse CPA website contact form.</p>
      </div>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: 'SouthHouse CPA <hello@southhousecpa.com>',
      to: ['southhousecpa@gmail.com'],
      reply_to: email.trim(),
      subject: `New Inquiry from ${name.trim()} — SouthHouse CPA`,
      html: htmlBody,
    });

    if (error) {
      console.error('Resend API error:', error);
      return res.status(500).json({ error: 'Failed to send message. Please try again.' });
    }

    return res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
  }
};

/**
 * Escape HTML entities to prevent XSS in the email body.
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
