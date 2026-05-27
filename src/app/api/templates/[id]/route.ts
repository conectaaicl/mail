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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { name, subject, htmlContent, textContent } = await req.json();
  await prisma.template.updateMany({ where: { id, workspaceId }, data: { name, subject, htmlContent, textContent } });
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.template.deleteMany({ where: { id, workspaceId } });
  return NextResponse.json({ success: true });
}
