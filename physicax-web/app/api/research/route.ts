import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

export const runtime = "nodejs";

const serializeJson = (value: unknown) => {
  if (value === null || value === undefined) {
    return "{}";
  }
  if (typeof value === "string") {
    try {
      JSON.parse(value);
      return value;
    } catch {
      return JSON.stringify({ value });
    }
  }
  return JSON.stringify(value);
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const runs = await prisma.researchRun.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(
    runs.map((run) => ({
      ...run,
      params: run.params ? JSON.parse(run.params) : {},
      results: run.results ? JSON.parse(run.results) : {}
    }))
  );
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
  const saved = await prisma.researchRun.create({
    data: {
      title: String(body.title || "Research run"),
      model: String(body.model || "unknown"),
      params: serializeJson(body.params ?? {}),
      results: serializeJson(body.results ?? {}),
      status: String(body.status || "completed"),
      userId: user.id
    }
  });
  return NextResponse.json(saved);
}
