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
  var rawPass = process.env.MAIL_APP_PASSWORD || process.env.EMAIL_PASS || process.env.MAIL_PASS;
  var adminPass = rawPass ? String(rawPass).replace(/\s+/g, '') : '';

  if (!adminPass) {
    throw new Error('Thieu Mat khau ung dung (App Password).');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: adminEmail,
      pass: adminPass
    }
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
