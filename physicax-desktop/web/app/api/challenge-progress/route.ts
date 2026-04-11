import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

export const runtime = "nodejs";

const badgeDefs = [
  { key: "first-solve", title: "First Solution", description: "Complete one challenge." },
  { key: "five-solve", title: "Momentum", description: "Complete five challenges." },
  { key: "ten-solve", title: "Master Solver", description: "Complete ten challenges." }
];

const ensureBadges = async () => {
  const records = await Promise.all(
    badgeDefs.map((badge) =>
      prisma.badge.upsert({
        where: { key: badge.key },
        update: {},
        create: {
          key: badge.key,
          title: badge.title,
          description: badge.description
        }
      })
    )
  );
  return records;
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
  const progress = await prisma.challengeProgress.findMany({
    where: { userId: user.id },
    include: { challenge: { include: { set: true } } },
    orderBy: { updatedAt: "desc" }
  });
  return NextResponse.json(progress);
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
  const challengeId = String(body.challengeId || "");
  if (!challengeId) {
    return NextResponse.json({ error: "Missing challengeId" }, { status: 400 });
  }
  const correct = Boolean(body.correct);
  const score = typeof body.score === "number" ? body.score : null;

  const progress = await prisma.challengeProgress.upsert({
    where: { userId_challengeId: { userId: user.id, challengeId } },
    update: {
      attempts: { increment: 1 },
      bestScore: score !== null ? score : undefined,
      completed: correct ? true : undefined,
      completedAt: correct ? new Date() : undefined
    },
    create: {
      userId: user.id,
      challengeId,
      attempts: 1,
      bestScore: score,
      completed: correct,
      completedAt: correct ? new Date() : null
    }
  });

  await ensureBadges();
  const completedCount = await prisma.challengeProgress.count({
    where: { userId: user.id, completed: true }
  });

  const earnedKeys: string[] = [];
  if (completedCount >= 1) earnedKeys.push("first-solve");
  if (completedCount >= 5) earnedKeys.push("five-solve");
  if (completedCount >= 10) earnedKeys.push("ten-solve");

  if (earnedKeys.length) {
    const badgeRecords = await prisma.badge.findMany({ where: { key: { in: earnedKeys } } });
    await Promise.all(
      badgeRecords.map((badge) =>
        prisma.userBadge.upsert({
          where: { userId_badgeId: { userId: user.id, badgeId: badge.id } },
          update: {},
          create: { userId: user.id, badgeId: badge.id }
        })
      )
    );
  }

  return NextResponse.json({ progress, completedCount });
}
