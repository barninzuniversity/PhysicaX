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
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const experiments = await prisma.experiment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { collection: true, folder: true }
  });
  const normalized = experiments.map((item) => ({
    ...item,
    inputs: parseJson(item.inputs),
    outputs: parseJson(item.outputs)
  }));
  return NextResponse.json(normalized);
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
  const data = {
    title: String(body.title || "Untitled"),
    model: String(body.model || "unknown"),
    inputs: serializeJson(body.inputs ?? {}),
    outputs: serializeJson(body.outputs ?? {}),
    notes: body.notes ? String(body.notes) : null,
    tags: body.tags ? String(body.tags) : null,
    visibility: body.visibility === "public" ? "public" : "private",
    userId: user.id,
    collectionId: body.collectionId ? String(body.collectionId) : null,
    folderId: body.folderId ? String(body.folderId) : null,
    parentId: body.parentId ? String(body.parentId) : null,
    version: Number.isFinite(Number(body.version)) ? Number(body.version) : 1,
    forkedFromId: body.forkedFromId ? String(body.forkedFromId) : null
  };
  const saved = await prisma.experiment.create({ data });
  const tagList = String(body.tags || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  if (tagList.length) {
    const tagRecords = await Promise.all(
      tagList.map((label) =>
        prisma.experimentTag.upsert({
          where: { label_userId: { label, userId: user.id } },
          update: {},
          create: { label, userId: user.id }
        })
      )
    );
    await Promise.all(
      tagRecords.map((tag) =>
        prisma.experimentTagMap.upsert({
          where: { experimentId_tagId: { experimentId: saved.id, tagId: tag.id } },
          update: {},
          create: { experimentId: saved.id, tagId: tag.id }
        })
      )
    );
  }
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
  const updates: any = {};
  if (body.title !== undefined) updates.title = String(body.title || "Untitled");
  if (body.notes !== undefined) updates.notes = body.notes ? String(body.notes) : null;
  if (body.visibility !== undefined) updates.visibility = body.visibility === "public" ? "public" : "private";
  if (body.folderId !== undefined) updates.folderId = body.folderId ? String(body.folderId) : null;
  if (body.tags !== undefined) updates.tags = body.tags ? String(body.tags) : null;

  const updated = await prisma.experiment.update({
    where: { id, userId: user.id },
    data: updates,
    include: { collection: true, folder: true }
  });

  if (body.tags !== undefined) {
    await prisma.experimentTagMap.deleteMany({ where: { experimentId: id } });
    const tagList = String(body.tags || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    if (tagList.length) {
      const tagRecords = await Promise.all(
        tagList.map((label) =>
          prisma.experimentTag.upsert({
            where: { label_userId: { label, userId: user.id } },
            update: {},
            create: { label, userId: user.id }
          })
        )
      );
      await Promise.all(
        tagRecords.map((tag) =>
          prisma.experimentTagMap.upsert({
            where: { experimentId_tagId: { experimentId: id, tagId: tag.id } },
            update: {},
            create: { experimentId: id, tagId: tag.id }
          })
        )
      );
    }
  }

  const normalized = {
    ...updated,
    inputs: parseJson(updated.inputs),
    outputs: parseJson(updated.outputs)
  };
  return NextResponse.json(normalized);
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  await prisma.experimentTagMap.deleteMany({ where: { experimentId: id } });
  await prisma.experiment.delete({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}
