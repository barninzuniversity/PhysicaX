import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";

export async function POST(_req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const params = await context.params;
  const publication = await prisma.publication.findUnique({ where: { id: params.id } });
  if (!publication) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const updated = await prisma.publication.update({
    where: { id: params.id },
    data: { trendingScore: (publication.trendingScore ?? 0) + 5 }
  });
  return NextResponse.json(updated);
}
