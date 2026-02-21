import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { Tenant, User, Role, Store } from "@/lib/models";
import { createSession } from "@/lib/auth";

const STORE_TYPES = ["kirana", "supermarket", "departmental", "pharmacy", "electronics", "clothing", "other"] as const;

const RegisterStoreSchema = z.object({
  store_name: z.string().min(1),
  store_code: z.string().min(1).optional(),
  store_type: z.enum(STORE_TYPES),
  owner_info: z.object({
    name: z.string().min(1),
    phone: z.string().min(1),
    email: z.string().email(),
  }),
  address: z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().min(1),
    country: z.string().optional(),
    latitude: z.number().default(0),
    longitude: z.number().default(0),
    landmark: z.string().optional(),
  }),
  password: z.string().min(6),
});

function generateStoreCode(): string {
  return `ST${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = RegisterStoreSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }
    const { store_name, store_code, store_type, owner_info, address, password } = parsed.data;

    await dbConnect();

    const tenant = await Tenant.findOne({ status: "active" }).sort({ created_at: 1 }).lean();
    if (!tenant) {
      return NextResponse.json({ error: "No organization configured. Contact support." }, { status: 404 });
    }
    const tenantId = tenant._id;

    const email = owner_info.email.toLowerCase();
    const existingUser = await User.findOne({ tenant_id: tenantId, email });
    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const code = store_code || generateStoreCode();
    const existingStore = await Store.findOne({ tenant_id: tenantId, store_code: code });
    if (existingStore) {
      return NextResponse.json({ error: "Store code already taken. Please choose another." }, { status: 409 });
    }

    const store = await Store.create({
      tenant_id: tenantId,
      store_code: code,
      store_name,
      store_type,
      owner_info: { name: owner_info.name, phone: owner_info.phone, email: owner_info.email },
      address: {
        ...address,
        country: address.country || "India",
      },
      credit_info: { credit_limit: 0, credit_days: 0, payment_terms: "cash" },
      is_active: true,
    });

    let storeRole = await Role.findOne({ tenant_id: tenantId, code: "store" });
    if (!storeRole) {
      storeRole = await Role.create({
        tenant_id: tenantId,
        name: "Store owner",
        code: "store",
        domain_type: "store",
        is_default: false,
        is_active: true,
      });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const nameParts = owner_info.name.trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] || owner_info.name;
    const lastName = nameParts.slice(1).join(" ") || firstName || "-";
    const fullName = owner_info.name.trim() || `${firstName} ${lastName}`.trim();
    const user = await User.create({
      tenant_id: tenantId,
      name: fullName,
      email,
      phone: owner_info.phone,
      password_hash,
      first_name: firstName,
      last_name: lastName,
      role_id: storeRole._id,
      domain_associations: [
        { domain_type: "store", domain_id: store._id, role_id: storeRole._id, is_primary: true, is_active: true },
      ],
      status: "active",
    });

    await createSession({
      userId: user._id.toString(),
      tenantId: tenantId.toString(),
      email: user.email,
    });

    return NextResponse.json({
      user: {
        id: user._id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        user_type: "store",
        store_id: store._id.toString(),
        company_name: tenant.company_name,
        subdomain: tenant.subdomain,
      },
    });
  } catch (err) {
    console.error("Register-store error:", err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
