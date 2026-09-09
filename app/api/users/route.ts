import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { User, Role } from "@/lib/models";
import { requireSession } from "@/lib/auth";

const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(6),
  role_id: z.string().min(1),
});

export async function GET() {
  try {
    const session = await requireSession();
    await dbConnect();

    const users = await User.find({ tenant_id: session.tenantId })
      .populate("role_id", "name code permissions")
      .sort({ created_at: -1 })
      .lean();

    return NextResponse.json({ data: users });
  } catch (e) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: "Failed to list team users" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const parsed = CreateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    await dbConnect();

    const existing = await User.findOne({
      tenant_id: session.tenantId,
      email: parsed.data.email.toLowerCase(),
    });

    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists in your company." }, { status: 409 });
    }

    const targetRole = await Role.findOne({ _id: parsed.data.role_id, tenant_id: session.tenantId });
    if (!targetRole) {
      return NextResponse.json({ error: "Invalid role selected." }, { status: 400 });
    }

    const password_hash = await bcrypt.hash(parsed.data.password, 10);

    const newUser = await User.create({
      tenant_id: session.tenantId,
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      phone: parsed.data.phone || undefined,
      password_hash,
      role_id: targetRole._id,
      status: "active",
      created_by: session.userId,
    });

    return NextResponse.json({ data: newUser });
  } catch (e) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: "Failed to create user account" }, { status: 500 });
  }
}
