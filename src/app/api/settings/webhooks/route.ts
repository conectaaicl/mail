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
  // Webhooks stored as ApiKey with name prefix "webhook:"
  const webhooks = await prisma.apiKey.findMany({
    where: { workspaceId, name: { startsWith: "webhook:" } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    webhooks: webhooks.map(w => ({
      id: w.id,
      url: w.key,
      events: w.name.replace("webhook:", ""),
      createdAt: w.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { url, events } = await req.json();
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });
  const webhook = await prisma.apiKey.create({
    data: { name: `webhook:${events || "send"}`, key: url, workspaceId },
  });
  return NextResponse.json({ webhook }, { status: 201 });
}
