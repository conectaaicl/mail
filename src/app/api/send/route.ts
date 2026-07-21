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

function resolveFrom(requested: string | undefined | null, workspace: any): string | null {
  if (!requested) return null;
  const emailMatch = requested.match(/<([^>]+)>/);
  const emailPart = emailMatch ? emailMatch[1] : requested;
  const domain = emailPart.split("@")[1]?.toLowerCase();
  const ok = workspace.domains?.some((d: any) => d.verified && d.name.toLowerCase() === domain);
  return ok ? requested : null;
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer "))
      return NextResponse.json({ error: "Unauthorized. Bearer token required" }, { status: 401 });

    const apiKey = await prisma.apiKey.findUnique({
      where: { key: authHeader.split(" ")[1] },
      include: { workspace: { include: { domains: true } } },
    });
    if (!apiKey) return NextResponse.json({ error: "Invalid API Key" }, { status: 403 });

    const { to, template_id, template_name, subject, html, text, variables, from, reply_to, attachments } = await req.json();
    if (!to) return NextResponse.json({ error: "Missing 'to' field" }, { status: 400 });

    let mailAttachments: { filename: string; content: string; encoding: "base64" }[] | undefined;
    if (Array.isArray(attachments)) {
      const MAX_ATTACHMENTS = 5;
      const MAX_TOTAL_BYTES = 15 * 1024 * 1024; // 15MB, limite razonable para SMTP
      if (attachments.length > MAX_ATTACHMENTS) {
        return NextResponse.json({ error: `Maximo ${MAX_ATTACHMENTS} adjuntos` }, { status: 400 });
      }
      let totalBytes = 0;
      mailAttachments = attachments.map((a: any) => {
        const content = String(a.content || "");
        totalBytes += Math.ceil((content.length * 3) / 4); // aprox tamaño real en base64
        return { filename: String(a.filename || "adjunto"), content, encoding: "base64" as const };
      });
      if (totalBytes > MAX_TOTAL_BYTES) {
        return NextResponse.json({ error: "Adjuntos superan el tamaño máximo permitido (15MB)" }, { status: 400 });
      }
    }

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

    const resolvedFrom = resolveFrom(from, apiKey.workspace);
  const fromAddress = resolvedFrom || process.env.SMTP_FROM || `noreply@${apiKey.workspace.slug}.com`;
    const record = await prisma.email.create({
      data: { to, from: fromAddress, subject: finalSubject, bodyHtml: finalHtml, bodyText: finalText, direction: "OUTBOUND", status: "PENDING", workspaceId: apiKey.workspaceId },
    });

    try {
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        await transporter.sendMail({ from: `"${apiKey.workspace.name}" <${fromAddress}>`, to, subject: finalSubject, html: finalHtml || undefined, text: finalText || undefined, replyTo: reply_to || undefined, attachments: mailAttachments });
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
