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
  const apiKeys = await prisma.apiKey.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ apiKeys });
}

export async function POST() {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const key = await prisma.apiKey.create({
    data: {
      name: "Integration Key",
      key: "sk_live_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      workspaceId,
    },
  });
  return NextResponse.json({ key }, { status: 201 });
}
