var nodemailer = require('nodemailer');

var transporter = null;

function getEmailCredentials() {
  var adminEmail = process.env.EMAIL_USER || process.env.MAIL_USER || 'anhgoodboy100@gmail.com';
  var rawPass = process.env.MAIL_APP_PASSWORD || process.env.EMAIL_PASS || process.env.MAIL_PASS;
  var adminPass = rawPass ? String(rawPass).replace(/\s+/g, '') : '';

  if (!adminEmail) {
    throw new Error('Thieu EMAIL_USER hoac MAIL_USER.');
  }

  if (!adminPass) {
    throw new Error('Thieu MAIL_APP_PASSWORD hoac EMAIL_PASS.');
  }

  return {
    adminEmail: adminEmail,
    adminPass: adminPass,
  };
}

function createTransporter(port, secure) {
  var creds = getEmailCredentials();
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: port,
    secure: secure,
    auth: {
      user: creds.adminEmail,
      pass: creds.adminPass
    },
    authMethod: 'LOGIN',
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 30000,
    requireTLS: !secure
  });
}

async function buildWorkingTransporter() {
  var primaryTransporter = createTransporter(587, false);

  try {
    await primaryTransporter.verify();
    return primaryTransporter;
  } catch (primaryError) {
    console.error('SMTP verify failed on primary config:', primaryError.message || primaryError);

    var fallbackTransporter = createTransporter(465, true);

    await fallbackTransporter.verify();
    return fallbackTransporter;
  }
}

var sendMail = async function(to, subject, html) {
  try {
    if (!transporter) {
      transporter = await buildWorkingTransporter();
    }

    var creds = getEmailCredentials();

    var fromName = process.env.MAIL_FROM_NAME || 'KATEE Admin';

    var info = await transporter.sendMail({
      from: '"' + fromName + '" <' + creds.adminEmail + '>',
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
