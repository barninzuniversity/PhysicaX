import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { searchIndex } from "../../data/searchIndex";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = String(searchParams.get("q") || "").trim();
  if (!q) {
    return NextResponse.json([]);
  }
  const take = 12;
  const [experiments, publications, challenges, classrooms, assignments, notebooks, challengeSets] = await Promise.all([
    prisma.experiment.findMany({
      where: { title: { contains: q } },
      orderBy: { createdAt: "desc" },
      take
    }),
    prisma.publication.findMany({
      where: { title: { contains: q } },
      orderBy: { createdAt: "desc" },
      take
    }),
    prisma.challenge.findMany({
      where: { title: { contains: q } },
      orderBy: { createdAt: "desc" },
      take
    }),
    prisma.classroom.findMany({
      where: { name: { contains: q } },
      orderBy: { createdAt: "desc" },
      take
    }),
    prisma.assignment.findMany({
      where: { title: { contains: q } },
      orderBy: { createdAt: "desc" },
      take
    }),
    prisma.notebook.findMany({
      where: { title: { contains: q } },
      orderBy: { updatedAt: "desc" },
      take
    }),
    prisma.challengeSet.findMany({
      where: { title: { contains: q } },
      orderBy: { createdAt: "desc" },
      take
    })
  ]);

  const dbResults = [
    ...experiments.map((item) => ({
      title: item.title,
      href: "/dashboard",
      category: "experiment",
      summary: item.model
    })),
    ...publications.map((item) => ({
      title: item.title,
      href: "/gallery",
      category: "publication",
      summary: item.model
    })),
    ...challenges.map((item) => ({
      title: item.title,
      href: "/education",
      category: "challenge",
      summary: item.prompt
    })),
    ...classrooms.map((item) => ({
      title: item.name,
      href: "/education",
      category: "classroom",
      summary: item.description ?? ""
    })),
    ...assignments.map((item) => ({
      title: item.title,
      href: "/education",
      category: "assignment",
      summary: item.description ?? ""
    })),
    ...notebooks.map((item) => ({
      title: item.title,
      href: "/research/notebook",
      category: "notebook",
      summary: "Research notebook"
    })),
    ...challengeSets.map((item) => ({
      title: item.title,
      href: "/challenges",
      category: "challenge",
      summary: item.description ?? "Challenge set"
    }))
  ];

  const qLower = q.toLowerCase();
  const staticResults = searchIndex.filter((entry) => {
    const inTitle = entry.title.toLowerCase().includes(qLower);
    const inSummary = entry.summary.toLowerCase().includes(qLower);
    const inTags = entry.tags.some((tag) => tag.toLowerCase().includes(qLower));
    return inTitle || inSummary || inTags;
  });

  const merged = [...dbResults, ...staticResults].reduce((acc: any[], item) => {
    const key = `${item.title}-${item.href}`;
    if (!acc.some((existing) => `${existing.title}-${existing.href}` === key)) {
      acc.push(item);
    }
    return acc;
  }, []);

  return NextResponse.json(merged.slice(0, take * 2));
}
