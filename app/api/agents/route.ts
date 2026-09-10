import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { Agent, User, Role } from "@/lib/models";
import { requireSession } from "@/lib/auth";

const CreateSchema = z.object({
  distributor_id: z.string().min(1),
  territory_id: z.string().min(1),
  agent_code: z.string().min(1),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  /** If provided, a login account is created for the agent (email + this password). */
  password: z.string().min(6).optional(),
  personal_info: z.object({
    phone: z.string().min(1),
    email: z.string().email().or(z.literal("")).optional(),
    alternate_phone: z.string().optional(),
    date_of_birth: z.string().optional(),
    gender: z.enum(["male", "female", "other"]).optional(),
    marital_status: z.enum(["single", "married", "divorced"]).optional(),
  }),
  address: z
    .object({
      line1: z.string().optional(),
      line2: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      province: z.string().optional(),
      pincode: z.string().optional(),
      country: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    })
    .optional(),
  employment: z.object({
    joining_date: z.string().or(z.date()),
    employment_type: z.enum(["full_time", "part_time", "contract"]).optional(),
    designation: z.string().optional(),
    reporting_to: z.string().optional(),
    security_deposit: z.number().optional(),
    commission_rate: z.number().optional(),
  }),
  targets: z
    .object({
      monthly_sales: z.number().optional(),
      monthly_orders: z.number().optional(),
      monthly_visits: z.number().optional(),
      new_store_acquisition: z.number().optional(),
    })
    .optional(),
  bank_details: z
    .object({
      account_holder_name: z.string().optional(),
      account_number: z.string().optional(),
      bank_name: z.string().optional(),
      ifsc_code: z.string().optional(),
      upi_id: z.string().optional(),
    })
    .optional(),
});

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const distributorId = searchParams.get("distributor_id");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    await dbConnect();
    const filter: Record<string, unknown> = { tenant_id: session.tenantId, is_active: true };
    if (distributorId) filter.distributor_id = distributorId;

    const [list, total] = await Promise.all([
      Agent.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
      Agent.countDocuments(filter),
    ]);

    return NextResponse.json({
      data: list,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (e) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: "Failed to list agents" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }
    const employment = { ...parsed.data.employment, joining_date: new Date(parsed.data.employment.joining_date as string) };
    await dbConnect();
    const existing = await Agent.findOne({
      tenant_id: session.tenantId,
      agent_code: parsed.data.agent_code,
    });
    if (existing) return NextResponse.json({ error: "Agent code already exists" }, { status: 409 });
    const doc = await Agent.create({
      distributor_id: parsed.data.distributor_id,
      territory_id: parsed.data.territory_id,
      agent_code: parsed.data.agent_code,
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      personal_info: parsed.data.personal_info,
      address: parsed.data.address,
      employment,
      targets: parsed.data.targets,
      bank_details: parsed.data.bank_details,
      tenant_id: session.tenantId,
      created_by: session.userId,
    });

    if (parsed.data.password && parsed.data.personal_info?.email) {
      const agentEmail = parsed.data.personal_info.email.toLowerCase();
      const existingUser = await User.findOne({ tenant_id: session.tenantId, email: agentEmail });
      if (existingUser) {
        await Agent.deleteOne({ _id: doc._id });
        return NextResponse.json({ error: "A user with this email already exists in the organization" }, { status: 409 });
      }
      let agentRole = await Role.findOne({ tenant_id: session.tenantId, code: "agent" });
      if (!agentRole) {
        agentRole = await Role.create({
          tenant_id: session.tenantId,
          name: "Agent",
          code: "agent",
          domain_type: "agent",
          is_default: false,
          is_active: true,
        });
      }
      const password_hash = await bcrypt.hash(parsed.data.password, 10);
      const fullName = `${parsed.data.first_name} ${parsed.data.last_name}`.trim();
      await User.create({
        tenant_id: session.tenantId,
        name: fullName,
        email: agentEmail,
        phone: parsed.data.personal_info.phone,
        password_hash,
        first_name: parsed.data.first_name,
        last_name: parsed.data.last_name,
        role_id: agentRole._id,
        domain_associations: [
          { domain_type: "agent", domain_id: doc._id, role_id: agentRole._id, is_primary: true, is_active: true },
        ],
        status: "active",
      });
    }

    return NextResponse.json({ data: doc });
  } catch (e) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: "Failed to create agent" }, { status: 500 });
  }
}
