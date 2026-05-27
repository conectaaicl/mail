import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";

const prisma = new PrismaClient();

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const member = await prisma.workspaceMember.findFirst({ where: { userId: session.user.id } });
  if (!member) return NextResponse.json({ emails: [] });
  const emails = await prisma.email.findMany({
    where: { workspaceId: member.workspaceId, direction: "INBOUND" },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ emails });
}
