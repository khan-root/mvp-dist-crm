import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { Tenant, User } from "@/lib/models";
import { createSession } from "@/lib/auth";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  subdomain: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 400 });
    }
    const { email, password, subdomain } = parsed.data;

    await dbConnect();

    const tenantFilter = subdomain ? { subdomain } : {};
    const tenant = await Tenant.findOne(tenantFilter).sort({ created_at: -1 });
    if (!tenant) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const user = await User.findOne({ tenant_id: tenant._id, email: email.toLowerCase(), status: "active" }).lean();
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await createSession({
      userId: user._id.toString(),
      tenantId: tenant._id.toString(),
      email: user.email,
    });

    const associations = user.domain_associations || [];
    const primary = associations.find((a: { is_primary?: boolean }) => a.is_primary);
    const assoc = primary || associations[0];
    let user_type: "admin" | "agent" | "store" = "admin";
    let agent_id: string | null = null;
    let store_id: string | null = null;
    if (assoc?.domain_type === "agent") {
      user_type = "agent";
      agent_id = assoc.domain_id?.toString?.() ?? null;
    } else if (assoc?.domain_type === "store") {
      user_type = "store";
      store_id = assoc.domain_id?.toString?.() ?? null;
    }

    return NextResponse.json({
      user: {
        id: user._id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        tenant_id: tenant._id,
        company_name: tenant.company_name,
        subdomain: tenant.subdomain,
        user_type,
        agent_id,
        store_id,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
