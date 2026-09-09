import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/db";
import {
  Product,
  Agent,
  Distributor,
  Store,
  Territory,
  Route,
  Category,
  Brand,
  User,
  Role,
} from "@/lib/models";
import { requireSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const { entity, rows } = body as { entity: string; rows: Record<string, string>[] };

    if (!entity || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "Invalid payload. 'entity' and non-empty 'rows' required." }, { status: 400 });
    }

    await dbConnect();

    let inserted = 0;
    let failed = 0;
    const errors: string[] = [];

    if (entity === "products") {
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        try {
          if (!r.product_name || !r.sku || !r.product_code) {
            failed++;
            errors.push(`Row ${i + 1}: Missing product_name, sku, or product_code.`);
            continue;
          }

          // Check duplicate
          const existing = await Product.findOne({ tenant_id: session.tenantId, sku: r.sku });
          if (existing) {
            failed++;
            errors.push(`Row ${i + 1}: Product with SKU '${r.sku}' already exists.`);
            continue;
          }

          // Resolve Distributor
          let distributorId = null;
          if (r.distributor_code) {
            const dist = await Distributor.findOne({ tenant_id: session.tenantId, distributor_code: r.distributor_code });
            if (dist) distributorId = dist._id;
          }
          if (!distributorId) {
            const firstDist = await Distributor.findOne({ tenant_id: session.tenantId });
            distributorId = firstDist?._id;
          }

          if (!distributorId) {
            failed++;
            errors.push(`Row ${i + 1}: No valid distributor found in organization.`);
            continue;
          }

          // Resolve or Create Category
          let categoryId = null;
          if (r.category_name) {
            let cat = await Category.findOne({ tenant_id: session.tenantId, category_name: r.category_name });
            if (!cat) {
              cat = await Category.create({
                tenant_id: session.tenantId,
                category_name: r.category_name,
                category_code: r.category_name.toUpperCase().replace(/[^A-Z0-9]/g, "_").slice(0, 10),
                created_by: session.userId,
              });
            }
            categoryId = cat._id;
          }

          // Resolve or Create Brand
          let brandId = null;
          if (r.brand_name) {
            let br = await Brand.findOne({ tenant_id: session.tenantId, brand_name: r.brand_name });
            if (!br) {
              br = await Brand.create({
                tenant_id: session.tenantId,
                brand_name: r.brand_name,
                brand_code: r.brand_name.toUpperCase().replace(/[^A-Z0-9]/g, "_").slice(0, 10),
                created_by: session.userId,
              });
            }
            brandId = br._id;
          }

          await Product.create({
            tenant_id: session.tenantId,
            distributor_id: distributorId,
            category_id: categoryId,
            brand_id: brandId,
            product_name: r.product_name,
            product_code: r.product_code,
            sku: r.sku,
            unit_of_measure: r.unit_of_measure || "piece",
            pricing: {
              base_cost: Number(r.base_cost) || 0,
              mrp: Number(r.mrp) || Number(r.base_cost) || 0,
              wholesale_price: r.wholesale_price ? Number(r.wholesale_price) : undefined,
              retail_price: r.retail_price ? Number(r.retail_price) : undefined,
            },
            inventory: {
              current_stock: Number(r.current_stock) || 0,
              minimum_stock: Number(r.minimum_stock) || 10,
            },
            status: { is_active: true },
            created_by: session.userId,
          });

          inserted++;
        } catch (e: any) {
          failed++;
          errors.push(`Row ${i + 1}: ${e?.message || "Failed to create product"}`);
        }
      }
    } else if (entity === "agents") {
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        try {
          if (!r.agent_code || !r.first_name || !r.last_name || !r.phone || !r.email) {
            failed++;
            errors.push(`Row ${i + 1}: Missing required agent fields (code, name, email, phone).`);
            continue;
          }

          const existing = await Agent.findOne({ tenant_id: session.tenantId, agent_code: r.agent_code });
          if (existing) {
            failed++;
            errors.push(`Row ${i + 1}: Agent with code '${r.agent_code}' already exists.`);
            continue;
          }

          // Resolve Distributor
          let dist = await Distributor.findOne({ tenant_id: session.tenantId, distributor_code: r.distributor_code });
          if (!dist) dist = await Distributor.findOne({ tenant_id: session.tenantId });
          if (!dist) {
            failed++;
            errors.push(`Row ${i + 1}: Distributor '${r.distributor_code || "default"}' not found.`);
            continue;
          }

          // Resolve Territory
          let terr = await Territory.findOne({ tenant_id: session.tenantId, territory_name: r.territory_name });
          if (!terr) terr = await Territory.findOne({ tenant_id: session.tenantId });
          if (!terr) {
            failed++;
            errors.push(`Row ${i + 1}: Territory '${r.territory_name || "default"}' not found.`);
            continue;
          }

          const doc = await Agent.create({
            tenant_id: session.tenantId,
            distributor_id: dist._id,
            territory_id: terr._id,
            agent_code: r.agent_code,
            first_name: r.first_name,
            last_name: r.last_name,
            personal_info: { email: r.email, phone: r.phone },
            address: { province: r.province, state: r.province, city: r.city, country: "Pakistan" },
            employment: {
              joining_date: r.joining_date ? new Date(r.joining_date) : new Date(),
              employment_type: r.employment_type || "full_time",
              designation: r.designation || "Order Booker",
            },
            created_by: session.userId,
          });

          if (r.password) {
            let agentRole = await Role.findOne({ tenant_id: session.tenantId, code: "agent" });
            if (!agentRole) {
              agentRole = await Role.create({
                tenant_id: session.tenantId,
                name: "Agent",
                code: "agent",
                domain_type: "agent",
              });
            }
            const password_hash = await bcrypt.hash(r.password, 10);
            await User.create({
              tenant_id: session.tenantId,
              name: `${r.first_name} ${r.last_name}`,
              email: r.email.toLowerCase(),
              phone: r.phone,
              password_hash,
              role_id: agentRole._id,
              domain_associations: [
                { domain_type: "agent", domain_id: doc._id, role_id: agentRole._id, is_primary: true, is_active: true },
              ],
              status: "active",
            });
          }

          inserted++;
        } catch (e: any) {
          failed++;
          errors.push(`Row ${i + 1}: ${e?.message || "Failed to create agent"}`);
        }
      }
    } else if (entity === "distributors") {
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        try {
          if (!r.company_name || !r.distributor_code || !r.phone || !r.email) {
            failed++;
            errors.push(`Row ${i + 1}: Missing company_name, distributor_code, phone, or email.`);
            continue;
          }
          const existing = await Distributor.findOne({ tenant_id: session.tenantId, distributor_code: r.distributor_code });
          if (existing) {
            failed++;
            errors.push(`Row ${i + 1}: Distributor code '${r.distributor_code}' already exists.`);
            continue;
          }

          await Distributor.create({
            tenant_id: session.tenantId,
            company_name: r.company_name,
            distributor_code: r.distributor_code,
            industry_domain: r.industry_domain || "fmcg",
            operating_model: r.operating_model || "distributor",
            gst_number: r.gst_number || "07-00-0000-000-00",
            address: { line1: r.line1, city: r.city, province: r.province, pincode: r.pincode, country: "Pakistan" },
            contact: { phone: r.phone, email: r.email },
            created_by: session.userId,
          });
          inserted++;
        } catch (e: any) {
          failed++;
          errors.push(`Row ${i + 1}: ${e?.message || "Failed to create distributor"}`);
        }
      }
    } else if (entity === "stores") {
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        try {
          if (!r.store_name || !r.store_code || !r.phone) {
            failed++;
            errors.push(`Row ${i + 1}: Missing store_name, store_code, or phone.`);
            continue;
          }
          const existing = await Store.findOne({ tenant_id: session.tenantId, store_code: r.store_code });
          if (existing) {
            failed++;
            errors.push(`Row ${i + 1}: Store code '${r.store_code}' already exists.`);
            continue;
          }

          let terr = await Territory.findOne({ tenant_id: session.tenantId, territory_name: r.territory_name });
          if (!terr) terr = await Territory.findOne({ tenant_id: session.tenantId });

          let dist = await Distributor.findOne({ tenant_id: session.tenantId });

          await Store.create({
            tenant_id: session.tenantId,
            distributor_id: dist?._id,
            territory_id: terr?._id,
            store_name: r.store_name,
            store_code: r.store_code,
            owner_info: { name: r.owner_name || r.store_name, phone: r.phone, email: r.email },
            contact_person: { name: r.owner_name || r.store_name, phone: r.phone, email: r.email },
            address: { line1: r.line1, city: r.city, province: r.province, pincode: r.pincode, country: "Pakistan" },
            is_active: true,
            created_by: session.userId,
          });
          inserted++;
        } catch (e: any) {
          failed++;
          errors.push(`Row ${i + 1}: ${e?.message || "Failed to create store"}`);
        }
      }
    } else if (entity === "territories") {
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        try {
          if (!r.territory_name || !r.territory_code) {
            failed++;
            errors.push(`Row ${i + 1}: Missing territory_name or territory_code.`);
            continue;
          }
          const existing = await Territory.findOne({ tenant_id: session.tenantId, territory_code: r.territory_code });
          if (existing) {
            failed++;
            errors.push(`Row ${i + 1}: Territory code '${r.territory_code}' already exists.`);
            continue;
          }

          await Territory.create({
            tenant_id: session.tenantId,
            territory_name: r.territory_name,
            territory_code: r.territory_code,
            province: r.province,
            city: r.city,
            region: r.region || "Central",
            created_by: session.userId,
          });
          inserted++;
        } catch (e: any) {
          failed++;
          errors.push(`Row ${i + 1}: ${e?.message || "Failed to create territory"}`);
        }
      }
    } else if (entity === "routes") {
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        try {
          if (!r.route_name || !r.route_code) {
            failed++;
            errors.push(`Row ${i + 1}: Missing route_name or route_code.`);
            continue;
          }
          const existing = await Route.findOne({ tenant_id: session.tenantId, route_code: r.route_code });
          if (existing) {
            failed++;
            errors.push(`Row ${i + 1}: Route code '${r.route_code}' already exists.`);
            continue;
          }

          let terr = await Territory.findOne({ tenant_id: session.tenantId, territory_name: r.territory_name });
          if (!terr) terr = await Territory.findOne({ tenant_id: session.tenantId });

          if (!terr) {
            failed++;
            errors.push(`Row ${i + 1}: No territory available for route.`);
            continue;
          }

          await Route.create({
            tenant_id: session.tenantId,
            territory_id: terr._id,
            route_name: r.route_name,
            route_code: r.route_code,
            start_point: { name: r.start_point || "Hub" },
            end_point: { name: r.end_point || "Market" },
            distance_km: Number(r.distance_km) || 10,
            is_active: true,
            created_by: session.userId,
          });
          inserted++;
        } catch (e: any) {
          failed++;
          errors.push(`Row ${i + 1}: ${e?.message || "Failed to create route"}`);
        }
      }
    }

    return NextResponse.json({
      data: {
        total: rows.length,
        inserted,
        failed,
        errors,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Bulk import processing failed" }, { status: 500 });
  }
}
