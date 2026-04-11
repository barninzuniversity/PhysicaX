import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const items = await prisma.assignment.findMany({
    orderBy: { createdAt: "desc" },
    include: { classroom: true }
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
  const saved = await prisma.assignment.create({
    data: {
      title: String(body.title || "Untitled assignment"),
      description: body.description ? String(body.description) : null,
      rubric: body.rubric ? String(body.rubric) : null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      classroomId: body.classroomId ? String(body.classroomId) : null,
      authorId: user?.id ?? null
    }
  });
  return NextResponse.json(saved);
}
