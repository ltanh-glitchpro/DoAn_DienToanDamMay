var nodemailer = require('nodemailer');

var sendMail = async function(to, subject, html) {
  try {
    var adminEmail = process.env.MAIL_USER || 'anhgoodboy100@gmail.com';
    var adminPass = process.env.MAIL_APP_PASSWORD || process.env.MAIL_PASS;

    if (!adminPass) {
      throw new Error('Thieu MAIL_APP_PASSWORD (hoac MAIL_PASS) trong bien moi truong.');
    }

    var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: adminEmail,
        pass: adminPass
      }
    });

    await transporter.sendMail({
      from: '"KATEE Admin" <' + adminEmail + '>',
      to: to,
      subject: subject,
      html: html
    });

    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = sendMail;
