import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";

const parseJson = (value: unknown) => {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }
  if (typeof value === "object") return value;
  return {};
};

export async function POST(_req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const params = await context.params;
  const publication = await prisma.publication.findUnique({ where: { id: params.id } });
  if (!publication) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const forked = await prisma.experiment.create({
    data: {
      title: `Fork of ${publication.title}`,
      model: publication.model,
      inputs: JSON.stringify(parseJson(publication.inputs)),
      outputs: JSON.stringify(parseJson(publication.outputs)),
      notes: publication.notes,
      tags: publication.tags,
      visibility: "private",
      userId: user.id,
      parentId: null,
      version: 1,
      forkedFromId: publication.id
    }
  });
  return NextResponse.json(forked);
}
