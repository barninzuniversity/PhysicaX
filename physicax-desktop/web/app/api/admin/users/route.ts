import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

export const runtime = "nodejs";

const requireAdmin = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user || user.role !== "admin") {
    return { ok: false, status: 403, error: "Admin only" };
  }
  return { ok: true };
};

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, language: true, createdAt: true }
  });
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }
  const body = await req.json();
  const id = String(body.id || "");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const data: { role?: string; language?: string } = {};
  if (body.role) {
    data.role = String(body.role);
  }
  if (body.language) {
    data.language = String(body.language);
  }
  const updated = await prisma.user.update({
    where: { id },
    data
  });
  return NextResponse.json({ id: updated.id, role: updated.role, language: updated.language });
}
