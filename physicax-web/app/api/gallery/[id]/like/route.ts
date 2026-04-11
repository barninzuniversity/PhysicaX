import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const publicationId = id;
  const existing = await prisma.publicationLike.findUnique({
    where: { userId_publicationId: { userId: user.id, publicationId } }
  });
  if (existing) {
    await prisma.publicationLike.delete({ where: { id: existing.id } });
  } else {
    await prisma.publicationLike.create({ data: { userId: user.id, publicationId } });
  }
  const count = await prisma.publicationLike.count({ where: { publicationId } });
  await prisma.publication.update({
    where: { id: publicationId },
    data: { likesCount: count }
  });
  return NextResponse.json({ ok: true, likesCount: count, liked: !existing });
}
