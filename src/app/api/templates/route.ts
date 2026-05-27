import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";

const prisma = new PrismaClient();

async function getWorkspaceId() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const member = await prisma.workspaceMember.findFirst({ where: { userId: session.user.id } });
  return member?.workspaceId || null;
}

export async function GET() {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const templates = await prisma.template.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ templates });
}

export async function POST(req: Request) {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { name, subject, htmlContent, textContent } = await req.json();
  if (!name || !subject || !htmlContent) return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
  const template = await prisma.template.create({ data: { name, subject, htmlContent, textContent: textContent || "", workspaceId } });
  return NextResponse.json({ template }, { status: 201 });
}
