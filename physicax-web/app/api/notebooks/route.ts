import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const notebooks = await prisma.notebook.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" }
  });
  return NextResponse.json(notebooks);
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
  const title = String(body.title || "Notebook");
  const content = String(body.content || "");
  const links = Array.isArray(body.links)
    ? body.links.map((link: unknown) => String(link)).join(",")
    : body.links
      ? String(body.links)
      : null;
  const notebook = await prisma.notebook.create({
    data: { title, content, links, userId: user.id }
  });
  return NextResponse.json(notebook);
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
  const updates: any = {};
  if (body.title !== undefined) updates.title = String(body.title || "Notebook");
  if (body.content !== undefined) updates.content = String(body.content || "");
  if (body.links !== undefined) {
    updates.links = Array.isArray(body.links)
      ? body.links.map((link: string) => String(link)).join(",")
      : body.links
        ? String(body.links)
        : null;
  }
  const notebook = await prisma.notebook.update({
    where: { id, userId: user.id },
    data: updates
  });
  return NextResponse.json(notebook);
}
