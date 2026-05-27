import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";

const prisma = new PrismaClient();

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const member = await prisma.workspaceMember.findFirst({ where: { userId: session.user.id } });
  if (!member) return NextResponse.json({ domains: [], emails: [] });
  const [domains, emails] = await Promise.all([
    prisma.domain.findMany({ where: { workspaceId: member.workspaceId, verified: true } }),
    prisma.email.findMany({ where: { workspaceId: member.workspaceId, direction: "OUTBOUND" }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);
  return NextResponse.json({ domains, emails });
}
