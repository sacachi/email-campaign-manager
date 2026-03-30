import nodemailer from 'nodemailer';
import config from '../config';

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure,
  ignoreTLS: !config.smtp.secure,
  ...(config.smtp.user && config.smtp.pass
    ? { auth: { user: config.smtp.user, pass: config.smtp.pass } }
    : {}),
});

interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: config.smtp.from,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html || params.text,
    });
    return true;
  } catch (error) {
    console.error(`Failed to send email to ${params.to}:`, error);
    return false;
  }
}

export async function verifyConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('SMTP connection verified');
    return true;
  } catch (error) {
    console.warn('SMTP connection failed:', error);
    return false;
  }
}
