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
  const domains = await prisma.domain.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ domains });
}

export async function POST(req: Request) {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { domain } = await req.json();
  if (!domain) return NextResponse.json({ error: "Dominio requerido" }, { status: 400 });
  try {
    const created = await prisma.domain.create({
      data: { name: domain.toLowerCase().trim(), workspaceId, verified: false },
    });
    return NextResponse.json({ domain: created }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "El dominio ya existe" }, { status: 409 });
  }
}
