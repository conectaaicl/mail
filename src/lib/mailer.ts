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

export interface MailAttachment {
  filename: string
  content: string  // base64
  contentType?: string
}

export async function sendMail({
  from, to, subject, text, html, attachments,
}: {
  from: string
  to: string
  subject: string
  text?: string
  html?: string
  attachments?: MailAttachment[]
}) {
  const fromAddress = process.env.SMTP_FROM
    ? `${from.split('@')[0]} <${process.env.SMTP_FROM}>`
    : from

  const nodemailerAttachments = attachments?.map(a => ({
    filename: a.filename,
    content: Buffer.from(a.content, 'base64'),
    contentType: a.contentType || 'application/octet-stream',
  }))

  const transporter = createTransporter()
  const info = await transporter.sendMail({
    from: fromAddress,
    to,
    subject,
    text,
    html: html || text,
    replyTo: from,
    attachments: nodemailerAttachments,
  })
  return info
}
