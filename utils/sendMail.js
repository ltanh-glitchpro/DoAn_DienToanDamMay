var sgMail = require('@sendgrid/mail');

var sendMail = async function(to, subject, html) {
  try {
    // Initialize SendGrid API key
    var apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      throw new Error('SENDGRID_API_KEY is not configured in environment variables.');
    }

    sgMail.setApiKey(apiKey);

    // Configure email message
    var fromName = process.env.MAIL_FROM_NAME || 'KATEE Admin';
    var fromEmail = process.env.SENDGRID_FROM_EMAIL || 'anhgoodboy100@gmail.com';

    var msg = {
      to: to,
      from: {
        email: fromEmail,
        name: fromName
      },
      subject: subject,
      html: html
    };

    // Send email via SendGrid
    var info = await sgMail.send(msg);

    console.log('Email sent successfully:', {
      messageId: info[0].headers['x-message-id'],
      statusCode: info[0].statusCode
    });
    return info;
  } catch (error) {
    console.error('Error sending email:', error.message || error);
    throw error;
  }
};

module.exports = sendMail;
