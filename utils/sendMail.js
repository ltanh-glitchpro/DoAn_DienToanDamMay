var sgMail = require("@sendgrid/mail");
var nodemailer = require("nodemailer");

var sendMail = async function (to, subject, html) {
  var fromName = process.env.MAIL_FROM_NAME || "KATEE Admin";
  var fromEmail =
    process.env.MAIL_FROM_EMAIL ||
    process.env.SENDGRID_FROM_EMAIL ||
    process.env.SMTP_USER ||
    "no-reply@example.com";

  var sendgridApiKey = process.env.SENDGRID_API_KEY;
  var smtpUser = process.env.SMTP_USER || process.env.MAIL_USER || process.env.EMAIL_USER;
  var smtpPass = process.env.SMTP_PASS || process.env.MAIL_APP_PASSWORD || process.env.MAIL_PASS || process.env.EMAIL_PASS;
  var smtpHost = process.env.SMTP_HOST;
  var smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
  var smtpService = process.env.SMTP_SERVICE;

  var lastError = null;

  if (sendgridApiKey) {
    try {
      sgMail.setApiKey(sendgridApiKey);
      var msg = {
        to: to,
        from: {
          email: fromEmail,
          name: fromName,
        },
        subject: subject,
        html: html,
      };

      var info = await sgMail.send(msg);
      console.log("Email sent successfully via SendGrid", {
        to: to,
        statusCode: info && info[0] ? info[0].statusCode : undefined,
      });
      return info;
    } catch (error) {
      lastError = error;
      console.error("SendGrid send failed, trying SMTP fallback:", error.message || error);
    }
  }

  if (smtpUser && smtpPass) {
    try {
      var transportConfig = {
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      };

      if (smtpHost) {
        transportConfig.host = smtpHost;
        transportConfig.port = smtpPort;
        transportConfig.secure = smtpPort === 465;
      } else {
        transportConfig.service = smtpService || "gmail";
      }

      var transporter = nodemailer.createTransport(transportConfig);
      var mailResult = await transporter.sendMail({
        from: '"' + fromName + '" <' + fromEmail + '>',
        to: to,
        subject: subject,
        html: html,
      });

      console.log("Email sent successfully via SMTP", {
        to: to,
        messageId: mailResult.messageId,
      });
      return mailResult;
    } catch (error) {
      lastError = error;
      console.error("SMTP send failed:", error.message || error);
    }
  }

  throw (
    lastError ||
    new Error(
      "Mail transport is not configured. Provide SENDGRID_API_KEY or SMTP_USER + SMTP_PASS (or MAIL_USER/MAIL_APP_PASSWORD)."
    )
  );
};

module.exports = sendMail;
