import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Tenant, Distributor, Territory } from "@/lib/models";

/**
 * Public endpoint: returns distributors and territories for store self-registration.
 * Query: subdomain (required) – tenant subdomain.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const subdomain = searchParams.get("subdomain")?.toLowerCase().trim();
  if (!subdomain) {
    return NextResponse.json({ error: "subdomain is required" }, { status: 400 });
  }
  try {
    await dbConnect();
    const tenant = await Tenant.findOne({ subdomain, status: "active" }).lean();
    if (!tenant) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }
    const tenantId = tenant._id;
    const [distributors, territories] = await Promise.all([
      Distributor.find({ tenant_id: tenantId, is_active: true }).select("_id company_name distributor_code").sort({ company_name: 1 }).lean(),
      Territory.find({ tenant_id: tenantId, is_active: true }).select("_id territory_name territory_code").sort({ territory_name: 1 }).lean(),
    ]);
    return NextResponse.json({
      tenant: { name: tenant.company_name, subdomain: tenant.subdomain },
      distributors,
      territories,
    });
  } catch (err) {
    console.error("Register-data error:", err);
    return NextResponse.json({ error: "Failed to load data" }, { status: 500 });
  }
}
