import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer "))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = await prisma.apiKey.findUnique({
    where: { key: authHeader.split(" ")[1] },
    include: { workspace: true },
  });
  if (!apiKey) return NextResponse.json({ error: "Invalid API Key" }, { status: 403 });

  const { to, name, email, password, app_name, login_url } = await req.json();
  if (!to || !name || !email || !password)
    return NextResponse.json({ error: "Faltan campos: to, name, email, password" }, { status: 400 });

  const appName     = app_name || apiKey.workspace.name;
  const loginUrl    = login_url || process.env.NEXTAUTH_URL || "";
  const fromAddress = process.env.SMTP_FROM || `noreply@${apiKey.workspace.slug}.com`;

  const tpl = await prisma.template.findFirst({
    where: { workspaceId: apiKey.workspaceId, name: { in: ["credenciales", "credentials"] } },
  });

  let finalHtml    = tpl?.htmlContent || defaultHtml(name, email, password, appName, loginUrl);
  let finalSubject = tpl?.subject     || `Tus credenciales de acceso — ${appName}`;

  const vars: Record<string, string> = { nombre: name, name, email, password, app_name: appName, login_url: loginUrl };
  Object.entries(vars).forEach(([k, v]) => {
    const r = new RegExp(`{{\\s*${k}\\s*}}`, "g");
    finalHtml    = finalHtml.replace(r, v);
    finalSubject = finalSubject.replace(r, v);
  });

  const record = await prisma.email.create({
    data: { to, from: fromAddress, subject: finalSubject, bodyHtml: finalHtml, direction: "OUTBOUND", status: "PENDING", workspaceId: apiKey.workspaceId },
  });

  try {
    await transporter.sendMail({ from: `"${appName}" <${fromAddress}>`, to, subject: finalSubject, html: finalHtml });
    await prisma.email.update({ where: { id: record.id }, data: { status: "DELIVERED" } });
    return NextResponse.json({ success: true, emailId: record.id });
  } catch (err: any) {
    await prisma.email.update({ where: { id: record.id }, data: { status: "FAILED" } });
    return NextResponse.json({ error: "SMTP falló", details: err.message }, { status: 502 });
  }
}

function defaultHtml(name: string, email: string, password: string, appName: string, loginUrl: string) {
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f9f9f9">
  <div style="background:white;border-radius:12px;padding:32px;border:1px solid #eee">
    <h1 style="color:#111">Tus credenciales de acceso</h1>
    <p style="color:#555">Hola <strong>${name}</strong>, aquí están tus datos para <strong>${appName}</strong>:</p>
    <div style="background:#f4f4f4;border-radius:8px;padding:20px;margin:20px 0;border-left:4px solid #4f46e5">
      <p style="margin:0 0 8px;color:#333"><strong>Email:</strong> ${email}</p>
      <p style="margin:0;color:#333"><strong>Contraseña:</strong> <code style="background:#e8e8e8;padding:2px 6px;border-radius:4px">${password}</code></p>
    </div>
    <p style="color:#e44;font-size:13px">⚠️ Cambia tu contraseña después de iniciar sesión por primera vez.</p>
    ${loginUrl ? `<a href="${loginUrl}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#4f46e5;color:white;border-radius:8px;text-decoration:none;font-weight:bold">Iniciar sesión →</a>` : ""}
  </div></body></html>`;
}
