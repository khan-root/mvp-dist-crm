import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { Role } from "@/lib/models";
import { requireSession } from "@/lib/auth";

const ModulePermissionSchema = z.object({
  module_name: z.string().min(1),
  actions: z.array(z.string()),
});

const CreateRoleSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  permissions: z.object({
    modules: z.array(ModulePermissionSchema),
  }),
});

export async function GET() {
  try {
    const session = await requireSession();
    await dbConnect();

    let roles = await Role.find({ tenant_id: session.tenantId })
      .sort({ created_at: -1 })
      .lean();

    // If no custom roles exist, seed default Admin, Product Manager A, and Route Manager B roles
    if (roles.length === 0) {
      const defaultRoles = [
        {
          tenant_id: session.tenantId,
          name: "System Administrator",
          code: "admin",
          description: "Full read, write, update, and delete access across all enterprise modules.",
          is_default: true,
          permissions: {
            modules: [
              { module_name: "products", actions: ["read", "write", "update", "delete"] },
              { module_name: "routes", actions: ["read", "write", "update", "delete"] },
              { module_name: "territories", actions: ["read", "write", "update", "delete"] },
              { module_name: "distributors", actions: ["read", "write", "update", "delete"] },
              { module_name: "agents", actions: ["read", "write", "update", "delete"] },
              { module_name: "stores", actions: ["read", "write", "update", "delete"] },
              { module_name: "inventory", actions: ["read", "write", "update", "delete"] },
              { module_name: "orders", actions: ["read", "write", "update", "delete"] },
              { module_name: "policies", actions: ["read", "write", "update", "delete"] },
              { module_name: "warehouses", actions: ["read", "write", "update", "delete"] },
              { module_name: "roles", actions: ["read", "write", "update", "delete"] },
            ],
          },
        },
        {
          tenant_id: session.tenantId,
          name: "Product Manager A",
          code: "product_manager_a",
          description: "Exclusive authority over Products, Catalog, SKUs & Inventory management.",
          is_default: false,
          permissions: {
            modules: [
              { module_name: "products", actions: ["read", "write", "update", "delete"] },
              { module_name: "inventory", actions: ["read", "write", "update"] },
              { module_name: "warehouses", actions: ["read"] },
              { module_name: "catalog", actions: ["read", "write", "update"] },
            ],
          },
        },
        {
          tenant_id: session.tenantId,
          name: "Route Manager B",
          code: "route_manager_b",
          description: "Exclusive authority over Sales Routes, Geofences & Territory configuration.",
          is_default: false,
          permissions: {
            modules: [
              { module_name: "routes", actions: ["read", "write", "update", "delete"] },
              { module_name: "territories", actions: ["read", "write", "update", "delete"] },
              { module_name: "agents", actions: ["read", "write", "update"] },
              { module_name: "stores", actions: ["read"] },
            ],
          },
        },
      ];

      await Role.insertMany(defaultRoles);
      roles = await Role.find({ tenant_id: session.tenantId })
        .sort({ created_at: -1 })
        .lean();
    }

    return NextResponse.json({ data: roles });
  } catch (e) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const parsed = CreateRoleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    await dbConnect();

    const existing = await Role.findOne({
      tenant_id: session.tenantId,
      code: parsed.data.code.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
    });

    if (existing) {
      return NextResponse.json({ error: `Role with code '${parsed.data.code}' already exists.` }, { status: 409 });
    }

    const doc = await Role.create({
      tenant_id: session.tenantId,
      name: parsed.data.name,
      code: parsed.data.code.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
      description: parsed.data.description,
      permissions: parsed.data.permissions,
      is_default: false,
      created_by: session.userId,
    });

    return NextResponse.json({ data: doc });
  } catch (e) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: "Failed to create role" }, { status: 500 });
  }
}
