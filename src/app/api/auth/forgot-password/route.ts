import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";
import crypto from "crypto";

const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const email = formData.get("email")?.toString();

    if (!email) {
      return NextResponse.redirect(new URL("/forgot-password?error=missing_email", req.url));
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return success even if not found to prevent email enumeration
      return NextResponse.redirect(new URL("/login?message=check_your_email", req.url));
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    // Delete existing tokens for this email
    await prisma.verificationToken.deleteMany({ where: { identifier: email } });
    
    await prisma.verificationToken.create({
      data: { identifier: email, token, expires }
    });

    const origin = req.headers.get("origin") || process.env.NEXTAUTH_URL || `http://${req.headers.get("host")}`;
    const resetUrl = `${origin}/reset-password?token=${token}`;

    console.log(`Reset URL for ${email}: ${resetUrl}`);

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail({
        from: `"MailSaaS" <noreply@conectaai.cl>`, // Update appropriately
        to: email,
        subject: "Restablece tu contraseña",
        html: `<p>Hola ${user.name || ''},</p>
               <p>Has solicitado restablecer tu contraseña. Haz clic en el enlace a continuación para asignar una nueva:</p>
               <p><a href="${resetUrl}">${resetUrl}</a></p>
               <p>Este enlace expirará en 1 hora.</p>
               <p>Si no fuiste tú, ignora este correo.</p>`
      });
    } else {
       console.warn("SMTP variables not set, skipping email out.");
    }

    return NextResponse.redirect(new URL("/login?message=check_your_email", req.url));

  } catch (error) {
    console.error("Forgot password error", error);
    return NextResponse.redirect(new URL("/forgot-password?error=server_error", req.url));
  }
}
