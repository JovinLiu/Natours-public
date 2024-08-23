// const { htmlToText } = require('html-to-text');
const nodemailer = require('nodemailer');
const pug = require('pug');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Jovin Liu <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    //修复一下这个sendgrid的问题，production模式下不能发邮件
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        host: process.env.MAILDELIVERY_HOST,
        port: process.env.MAILDELIVERY_PORT,
        auth: {
          user: process.env.MAILDELIVERY_USERNAME,
          pass: process.env.MAILDELIVERY_PASSWORD,
        },
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAILTRAP_HOST,
      port: process.env.EMAILTRAP_PORT,
      auth: { user: process.env.EMAILTRAP_USERNAME, pass: process.env.EMAILTRAP_PASSWORD },
    });
  }

  async send(template, subject) {
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      // text: htmlToText(html),
    };

    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family');
  }

  async sendPasswordReset() {
    await this.send('passwordReset', 'Your password reset token (valid for only 10 minutes)');
  }
};
