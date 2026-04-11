import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const comments = await prisma.publicationComment.findMany({
    where: { publicationId: id },
    orderBy: { createdAt: "desc" },
    include: { author: true }
  });
  return NextResponse.json(
    comments.map((comment) => ({
      ...comment,
      authorName: comment.author?.name ?? comment.author?.email ?? "Anonymous"
    }))
  );
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const content = String(body.content || "").trim();
  if (!content) {
    return NextResponse.json({ error: "Empty comment" }, { status: 400 });
  }
  const saved = await prisma.publicationComment.create({
    data: {
      content,
      publicationId: id,
      authorId: user.id
    }
  });
  return NextResponse.json(saved);
}
