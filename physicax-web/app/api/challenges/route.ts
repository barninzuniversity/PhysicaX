import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const items = await prisma.challenge.findMany({
    orderBy: { createdAt: "desc" },
    include: { set: true }
  });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  const body = await req.json();
  const saved = await prisma.challenge.create({
    data: {
      title: String(body.title || "Untitled challenge"),
      prompt: String(body.prompt || ""),
      difficulty: String(body.difficulty || "medium"),
      answerType: String(body.answerType || "numeric"),
      expected: body.expected ? String(body.expected) : null,
      hint: body.hint ? String(body.hint) : null,
      setId: body.setId ? String(body.setId) : null,
      authorId: user?.id ?? null
    }
  });
  return NextResponse.json(saved);
}
