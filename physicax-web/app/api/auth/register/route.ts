import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "../../../lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || "").toLowerCase().trim();
    const password = String(body.password || "");
    const name = String(body.name || "").trim();
    const language = String(body.language || "en");
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required." }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "User already exists." }, { status: 409 });
    }
    const hashed = await bcrypt.hash(password, 10);
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? "admin" : "user";
    const user = await prisma.user.create({
      data: {
        email,
        name: name || email,
        password: hashed,
        role,
        language
      }
    });
    return NextResponse.json({ id: user.id, email: user.email });
  } catch (err) {
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  }
}
