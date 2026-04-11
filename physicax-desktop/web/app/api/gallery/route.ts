import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

export const runtime = "nodejs";

const parseJson = (value: unknown) => {
  if (!value) {
    return {};
  }
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }
  if (typeof value === "object") {
    return value;
  }
  return {};
};

const serializeJson = (value: unknown) => {
  if (value === null || value === undefined) {
    return "{}";
  }
  if (typeof value === "string") {
    try {
      JSON.parse(value);
      return value;
    } catch {
      return JSON.stringify(value);
    }
  }
  return JSON.stringify(value);
};

export async function GET() {
  const items = await prisma.publication.findMany({
    orderBy: { createdAt: "desc" },
    include: { comments: true, likes: true, author: true }
  });
  const normalized = items.map((item) => ({
    ...item,
    inputs: parseJson(item.inputs),
    outputs: parseJson(item.outputs),
    commentsCount: item.comments?.length ?? 0,
    likesCount: item.likesCount ?? item.likes?.length ?? 0,
    authorName: item.author?.name ?? item.author?.email ?? null,
    trendingScore:
      item.trendingScore ??
      ((item.likesCount ?? item.likes?.length ?? 0) /
        (1 + Math.max(1, (Date.now() - item.createdAt.getTime()) / (1000 * 60 * 60 * 24))))
  }));
  return NextResponse.json(normalized);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  const body = await req.json();
  const data = {
    title: String(body.title || "Untitled"),
    model: String(body.model || "unknown"),
    inputs: serializeJson(body.inputs ?? {}),
    outputs: serializeJson(body.outputs ?? {}),
    notes: body.notes ? String(body.notes) : null,
    tags: body.tags ? String(body.tags) : null,
    authorId: user?.id ?? null
  };
  const published = await prisma.publication.create({ data });
  return NextResponse.json(published);
}
