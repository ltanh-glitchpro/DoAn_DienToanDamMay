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

  var smtpHost = process.env.MAIL_HOST || 'smtp.gmail.com';
  var smtpPort = parsePort(process.env.MAIL_PORT, 587);
  var smtpSecure = parseSecure(process.env.MAIL_SECURE, smtpPort === 465);

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: adminEmail,
      pass: adminPass
    },
    authMethod: 'LOGIN',
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 30000
  });
}

async function buildWorkingTransporter() {
  var primaryPort = parsePort(process.env.MAIL_PORT, 587);
  var alternatePort = primaryPort === 465 ? 587 : 465;
  var primaryTransporter = buildTransporter();

  try {
    await primaryTransporter.verify();
    return primaryTransporter;
  } catch (primaryError) {
    console.error('SMTP verify failed on primary config:', primaryError.message || primaryError);

    var adminEmail = process.env.MAIL_USER || process.env.EMAIL_USER || 'anhgoodboy100@gmail.com';
    var rawPass = process.env.MAIL_APP_PASSWORD || process.env.EMAIL_PASS || process.env.MAIL_PASS;
    var adminPass = rawPass ? String(rawPass).replace(/\s+/g, '') : '';

    var fallbackPort = alternatePort;
    var fallbackTransporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: fallbackPort,
      secure: fallbackPort === 465,
      auth: {
        user: adminEmail,
        pass: adminPass
      },
      authMethod: 'LOGIN',
      connectionTimeout: 20000,
      greetingTimeout: 20000,
      socketTimeout: 30000
    });

    try {
      await fallbackTransporter.verify();
      return fallbackTransporter;
    } catch (fallbackError) {
      console.error('SMTP verify failed on fallback config:', fallbackError.message || fallbackError);
      throw fallbackError;
    }
  }
}

var sendMail = async function(to, subject, html) {
  try {
    var adminEmail = process.env.MAIL_USER || process.env.EMAIL_USER || 'anhgoodboy100@gmail.com';
    if (!transporter) {
      transporter = await buildWorkingTransporter();
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
