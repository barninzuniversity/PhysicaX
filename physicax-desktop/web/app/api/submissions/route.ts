import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const assignmentId = searchParams.get("assignmentId");
  const where: any = {};
  if (assignmentId) {
    where.assignmentId = assignmentId;
  }
  if (user.role !== "admin") {
    where.OR = [
      { userId: user.id },
      { assignment: { authorId: user.id } }
    ];
  }
  const items = await prisma.submission.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      assignment: true,
      user: true
    }
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
  const assignmentId = String(body.assignmentId || "");
  if (!assignmentId) {
    return NextResponse.json({ error: "Missing assignmentId" }, { status: 400 });
  }
  const payload = body.payload ?? {};
  const saved = await prisma.submission.create({
    data: {
      assignmentId,
      userId: user.id,
      payload: JSON.stringify(payload),
      score: typeof body.score === "number" ? body.score : null
    }
  });
  return NextResponse.json(saved);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const id = String(body.id || "");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const submission = await prisma.submission.findUnique({
    where: { id },
    include: { assignment: true }
  });
  if (!submission) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (user.role !== "admin" && submission.assignment?.authorId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const score = typeof body.score === "number" ? body.score : null;
  const updated = await prisma.submission.update({
    where: { id },
    data: { score }
  });
  return NextResponse.json(updated);
}
