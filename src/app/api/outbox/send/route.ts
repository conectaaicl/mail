import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import { sendMail } from "@/lib/mailer";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const member = await prisma.workspaceMember.findFirst({ where: { userId: session.user.id } });
  if (!member) return NextResponse.json({ error: "No workspace" }, { status: 400 });
  const { from, to, subject, message } = await req.json();
  if (!from || !to || !subject || !message)
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  const record = await prisma.email.create({
    data: { from, to, subject, bodyText: message, direction: "OUTBOUND", status: "PENDING", workspaceId: member.workspaceId },
  });
  try {
    await sendMail({ from, to, subject, text: message });
    await prisma.email.update({ where: { id: record.id }, data: { status: "SENT" } });
    return NextResponse.json({ success: true, emailId: record.id });
  } catch (err: any) {
    await prisma.email.update({ where: { id: record.id }, data: { status: "FAILED" } });
    return NextResponse.json({ error: "SMTP falló: " + err.message }, { status: 502 });
  }
}
