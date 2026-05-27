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
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer "))
      return NextResponse.json({ error: "Unauthorized. Bearer token required" }, { status: 401 });

    const apiKey = await prisma.apiKey.findUnique({
      where: { key: authHeader.split(" ")[1] },
      include: { workspace: true },
    });
    if (!apiKey) return NextResponse.json({ error: "Invalid API Key" }, { status: 403 });

    const { to, template_id, template_name, subject, html, text, variables } = await req.json();
    if (!to) return NextResponse.json({ error: "Missing 'to' field" }, { status: 400 });

    let finalHtml = html || "";
    let finalText = text || "";
    let finalSubject = subject || "Sin asunto";

    if (template_id || template_name) {
      const template = template_id
        ? await prisma.template.findFirst({ where: { id: template_id, workspaceId: apiKey.workspaceId } })
        : await prisma.template.findFirst({ where: { name: template_name, workspaceId: apiKey.workspaceId } });

      if (!template) return NextResponse.json({ error: `Template '${template_id || template_name}' no encontrado` }, { status: 404 });

      finalHtml = template.htmlContent;
      finalText = template.textContent || "";
      finalSubject = template.subject;

      if (variables && typeof variables === "object") {
        Object.entries(variables).forEach(([k, v]) => {
          const r = new RegExp(`{{\\s*${k}\\s*}}`, "g");
          finalHtml    = finalHtml.replace(r, String(v));
          finalText    = finalText.replace(r, String(v));
          finalSubject = finalSubject.replace(r, String(v));
        });
      }
    }

    const fromAddress = process.env.SMTP_FROM || `noreply@${apiKey.workspace.slug}.com`;
    const record = await prisma.email.create({
      data: { to, from: fromAddress, subject: finalSubject, bodyHtml: finalHtml, bodyText: finalText, direction: "OUTBOUND", status: "PENDING", workspaceId: apiKey.workspaceId },
    });

    try {
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        await transporter.sendMail({ from: `"${apiKey.workspace.name}" <${fromAddress}>`, to, subject: finalSubject, html: finalHtml || undefined, text: finalText || undefined });
        await prisma.email.update({ where: { id: record.id }, data: { status: "DELIVERED" } });
      }
    } catch (err: any) {
      await prisma.email.update({ where: { id: record.id }, data: { status: "FAILED" } });
      return NextResponse.json({ error: "SMTP falló", details: err.message }, { status: 502 });
    }

    await prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsed: new Date() } });
    return NextResponse.json({ success: true, emailId: record.id });
  } catch (err: any) {
    return NextResponse.json({ error: "Internal Server Error", details: err.message }, { status: 500 });
  }
}
