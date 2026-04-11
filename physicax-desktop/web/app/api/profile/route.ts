import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

export const runtime = "nodejs";

const profileFields = [
  "name",
  "bio",
  "level",
  "language",
  "interests",
  "favoriteLabs",
  "visibility"
] as const;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const payload = profileFields.reduce((acc, key) => {
    acc[key] = user[key] ?? null;
    return acc;
  }, {} as Record<string, string | null>);
  return NextResponse.json({
    id: user.id,
    email: user.email,
    ...payload
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const data: Record<string, string | null> = {};
  for (const field of profileFields) {
    if (field in body) {
      const value = body[field];
      data[field] = value === null || value === undefined ? null : String(value);
    }
  }
  const updated = await prisma.user.update({
    where: { email: session.user.email },
    data
  });
  return NextResponse.json({ ok: true, user: updated });
}
