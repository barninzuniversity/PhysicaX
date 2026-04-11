import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

export const runtime = "nodejs";

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
  const classroomId = String(body.classroomId || "");
  if (!classroomId) {
    return NextResponse.json({ error: "Missing classroomId" }, { status: 400 });
  }
  const membership = await prisma.classroomMember.upsert({
    where: {
      classroomId_userId: { classroomId, userId: user.id }
    },
    update: {},
    create: { classroomId, userId: user.id, role: "student" }
  });
  return NextResponse.json(membership);
}
