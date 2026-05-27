import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "https://n8n.conectaai.cl/webhook/correo-entrante";

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    let to = "", from = "", subject = "", text = "", html = "";
    
    // Dynamic Detection: Is this a Brevo Inbound Webhook payload?
    if (payload.items && payload.items.length > 0) {
      const item = payload.items[0];
      to = item.To && item.To.length > 0 ? item.To[0].Address : "";
      from = item.From ? item.From.Address : "";
      subject = item.Subject || "No Subject";
      text = item.RawTextBody || "";
      html = item.RawHtmlBody || "";
    } else {
      // Generic Webhook Fallback
      to = payload.to; 
      from = payload.from; 
      subject = payload.subject;
      text = payload.text; 
      html = payload.html;
    }

    if (!to || !from) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Route to correct Tenant/Workspace based on domain
    const domainName = to.split('@')[1];
    const domain = await prisma.domain.findUnique({ where: { name: domainName } });

    if (!domain) {
      console.log(`Received email for unknown tenant domain: ${domainName}`);
      return NextResponse.json({ success: true, warning: "Domain not registered" }, { status: 200 });
    }

    // Save strictly to tenant space
    const savedEmail = await prisma.email.create({
      data: {
        to, from, subject, bodyText: text, bodyHtml: html,
        direction: "INBOUND", status: "DELIVERED",
        workspaceId: domain.workspaceId
      }
    });

    // Pass payload strictly to N8N Groq Engine
    if (N8N_WEBHOOK_URL) {
      try {
        await fetch(N8N_WEBHOOK_URL, {
          method: "POST", 
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event: "INBOUND_EMAIL", timestamp: new Date(), data: savedEmail })
        });
      } catch (err) {
        console.error("N8N forwarding failed", err);
      }
    }

    return NextResponse.json({ success: true, id: savedEmail.id }, { status: 200 });

  } catch (error) {
    console.error("Webhook Parse Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
