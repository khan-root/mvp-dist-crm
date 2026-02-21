import { NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/db";
import { Distributor } from "@/lib/models";
import { requireSession } from "@/lib/auth";

const UpdateSchema = z.object({
  company_name: z.string().min(1).optional(),
  distributor_code: z.string().min(1).optional(),
  business_license: z.string().optional(),
  gst_number: z.string().min(1).optional(),
  pan_number: z.string().optional(),
  contact: z
    .object({
      phone: z.string().optional(),
      email: z.string().email().optional(),
      alternate_phone: z.string().optional(),
      website: z.string().optional(),
    })
    .optional(),
  address: z
    .object({
      line1: z.string().optional(),
      line2: z.string().optional(),
      city: z.string().optional(),
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
      business_type: z.string().optional(),
      employee_count: z.number().optional(),
      annual_turnover: z.number().optional(),
      serviceable_pincodes: z.array(z.string()).optional(),
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
  is_active: z.boolean().optional(),
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    await dbConnect();
    const doc = await Distributor.findOne({ _id: id, tenant_id: session.tenantId }).lean();
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: doc });
  } catch (e) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: "Failed to get distributor" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    const body = await request.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }
    await dbConnect();
    const doc = await Distributor.findOneAndUpdate(
      { _id: id, tenant_id: session.tenantId },
      { $set: parsed.data },
      { new: true }
    ).lean();
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: doc });
  } catch (e) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: "Failed to update distributor" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    await dbConnect();
    const doc = await Distributor.findOneAndUpdate(
      { _id: id, tenant_id: session.tenantId },
      { $set: { is_active: false } },
      { new: true }
    ).lean();
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: doc });
  } catch (e) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: "Failed to delete distributor" }, { status: 500 });
  }
}
