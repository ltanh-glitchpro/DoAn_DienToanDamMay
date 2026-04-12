var nodemailer = require('nodemailer');

var transporter = null;

function parsePort(value, fallback) {
  var parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function parseSecure(value, fallback) {
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return fallback;
}

function buildTransporter() {
  var adminEmail = process.env.MAIL_USER || process.env.EMAIL_USER || 'anhgoodboy100@gmail.com';
  var rawPass = process.env.MAIL_APP_PASSWORD || process.env.MAIL_PASS || process.env.EMAIL_PASS;
  var adminPass = rawPass ? String(rawPass).replace(/\s+/g, '') : '';

  if (!adminPass) {
    throw new Error('Thieu MAIL_APP_PASSWORD (hoac MAIL_PASS). Tren Render, vui long cai bien moi truong nay.');
  }

  var smtpHost = process.env.MAIL_HOST;
  var hasCustomSmtp = Boolean(smtpHost);
  var smtpPort = parsePort(process.env.MAIL_PORT, hasCustomSmtp ? 465 : 465);
  var smtpSecure = parseSecure(process.env.MAIL_SECURE, hasCustomSmtp ? smtpPort === 465 : true);

  if (smtpHost) {
    return nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: adminEmail,
        pass: adminPass
      },
      connectionTimeout: 20000,
      greetingTimeout: 20000,
      socketTimeout: 30000
    });
  }

  // Fallback Gmail SMTP configuration for environments where service autodetection is unstable.
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: adminEmail,
      pass: adminPass
    },
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 30000
  });
}

var sendMail = async function(to, subject, html) {
  try {
    var adminEmail = process.env.MAIL_USER || process.env.EMAIL_USER || 'anhgoodboy100@gmail.com';
    if (!transporter) {
      transporter = buildTransporter();
    }

    var fromName = process.env.MAIL_FROM_NAME || 'KATEE Admin';

    var info = await transporter.sendMail({
      from: '"' + fromName + '" <' + adminEmail + '>',
      to: to,
      subject: subject,
      html: html
    });

    console.log('Email sent successfully:', info.messageId, {
      accepted: info.accepted,
      rejected: info.rejected
    });
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = sendMail;
