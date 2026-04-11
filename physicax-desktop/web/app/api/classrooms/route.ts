import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const items = await prisma.classroom.findMany({
    orderBy: { createdAt: "desc" },
    include: { members: true }
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
  const saved = await prisma.classroom.create({
    data: {
      name: String(body.name || "New classroom"),
      description: body.description ? String(body.description) : null,
      ownerId: user.id,
      members: {
        create: [{ userId: user.id, role: "instructor" }]
      }
    }
  });
  return NextResponse.json(saved);
}
