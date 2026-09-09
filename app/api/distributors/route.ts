import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { Distributor } from "@/lib/models";
import { requireSession } from "@/lib/auth";

const CreateSchema = z.object({
  company_name: z.string().min(1),
  distributor_code: z.string().min(1),
  industry_domain: z.string().optional(),
  operating_model: z.string().optional(),
  business_license: z.string().optional(),
  gst_number: z.string().min(1),
  pan_number: z.string().optional(),
  tax_registration: z
    .object({
      ntn_number: z.string().optional(),
      strn_number: z.string().optional(),
      drug_license_number: z.string().optional(),
    })
    .optional(),
  contact: z.object({
    phone: z.string().min(1),
    email: z.string().email(),
    alternate_phone: z.string().optional(),
    website: z.string().optional(),
  }),
  address: z
    .object({
      line1: z.string().optional(),
      line2: z.string().optional(),
      city: z.string().optional(),
      province: z.string().optional(),
      state: z.string().optional(),
      pincode: z.string().optional(),
      country: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    })
    .optional(),
  business_details: z
    .object({
      established_year: z.number().optional(),
      business_type: z.enum(["wholesale", "retail", "distributor", "manufacturer"]).optional(),
      employee_count: z.number().optional(),
      annual_turnover: z.number().optional(),
      serviceable_pincodes: z.array(z.string()).optional(),
      serviceable_cities: z.array(z.string()).optional(),
    })
    .optional(),
  bank_details: z
    .object({
      account_holder_name: z.string().optional(),
      account_number: z.string().optional(),
      bank_name: z.string().optional(),
      ifsc_code: z.string().optional(),
      branch: z.string().optional(),
      upi_id: z.string().optional(),
    })
    .optional(),
});

export async function GET() {
  try {
    const session = await requireSession();
    await dbConnect();
    const list = await Distributor.find({ tenant_id: session.tenantId, is_active: true })
      .sort({ created_at: -1 })
      .lean();
    return NextResponse.json({ data: list });
  } catch (e) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: "Failed to list distributors" }, { status: 500 });
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
    await dbConnect();
    const existing = await Distributor.findOne({
      tenant_id: session.tenantId,
      $or: [{ distributor_code: parsed.data.distributor_code }, { gst_number: parsed.data.gst_number }],
    });
    if (existing) {
      return NextResponse.json({ error: "Distributor code or GST already exists" }, { status: 409 });
    }
    const doc = await Distributor.create({
      ...parsed.data,
      tenant_id: session.tenantId,
      created_by: session.userId,
    });
    return NextResponse.json({ data: doc });
  } catch (e) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: "Failed to create distributor" }, { status: 500 });
  }
}
