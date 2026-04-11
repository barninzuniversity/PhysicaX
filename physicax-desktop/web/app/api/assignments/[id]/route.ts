import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

export const runtime = "nodejs";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const params = await context.params;
  const assignment = await prisma.assignment.findUnique({
    where: { id: params.id },
    include: {
      classroom: true,
      submissions: {
        include: { user: true },
        orderBy: { createdAt: "desc" }
      }
    }
  });
  if (!assignment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (user.role !== "admin" && assignment.authorId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(assignment);
}
