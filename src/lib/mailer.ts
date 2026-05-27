import nodemailer from 'nodemailer'

export function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

export async function sendMail({
  from, to, subject, text, html,
}: {
  from: string
  to: string
  subject: string
  text?: string
  html?: string
}) {
  const fromAddress = process.env.SMTP_FROM
    ? `${from.split('@')[0]} <${process.env.SMTP_FROM}>`
    : from

  const transporter = createTransporter()
  const info = await transporter.sendMail({
    from: fromAddress,
    to,
    subject,
    text,
    html: html || text,
    replyTo: from,
  })
  return info
}
