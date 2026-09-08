import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { Tenant, User, Role } from "@/lib/models";
import { createSession } from "@/lib/auth";

const RegisterSchema = z.object({
  company_name: z.string().min(1),
  subdomain: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  email: z.string().email(),
  password: z.string().min(6),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  phone: z.string().min(10),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { company_name, subdomain, email, password, first_name, last_name, phone } = parsed.data;

    await dbConnect();

    const existingTenant = await Tenant.findOne({ subdomain });
    if (existingTenant) {
      return NextResponse.json({ error: "Subdomain already taken" }, { status: 409 });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const tenant = await Tenant.create({
      name: company_name,
      company_name,
      subdomain,
      status: "active",
      plan: { type: "trial", subscription_status: "active", trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
    });

    let defaultRole = await Role.findOne({ tenant_id: tenant._id, code: "admin" });
    if (!defaultRole) {
      defaultRole = await Role.create({
        tenant_id: tenant._id,
        name: "Admin",
        code: "admin",
        domain_type: "system",
        is_default: true,
        is_active: true,
      });
    }

    const fullName = `${first_name} ${last_name}`.trim();
    const user = await User.create({
      tenant_id: tenant._id,
      name: fullName,
      email,
      phone,
      password_hash,
      first_name,
      last_name,
      role_id: defaultRole._id,
      status: "active",
    });

    await createSession({
      userId: user._id.toString(),
      tenantId: tenant._id.toString(),
      email: user.email,
    });

    return NextResponse.json({
      user: {
        id: user._id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        tenant_id: tenant._id,
        company_name: tenant.company_name,
        subdomain: tenant.subdomain,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
