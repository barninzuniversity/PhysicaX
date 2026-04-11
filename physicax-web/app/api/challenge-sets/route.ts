import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const items = await prisma.challengeSet.findMany({
    orderBy: { createdAt: "desc" },
    include: { challenges: true }
  });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const title = String(body.title || "New set");
  const description = body.description ? String(body.description) : null;
  const saved = await prisma.challengeSet.create({
    data: {
      title,
      description,
      authorId: user.id
    }
  });
  return NextResponse.json(saved);
}
