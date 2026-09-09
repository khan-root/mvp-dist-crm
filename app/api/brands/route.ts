import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Brand, Tenant } from "@/lib/models";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const brands = await Brand.find().sort({ brand_name: 1 }).lean();
    return NextResponse.json({ success: true, data: brands });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const tenant = await Tenant.findOne();
    if (!tenant) {
      return NextResponse.json({ success: false, error: "Tenant not found" }, { status: 404 });
    }

    const doc = await Brand.create({
      tenant_id: tenant._id,
      ...body,
    });

    return NextResponse.json({ success: true, message: "Brand created successfully", data: doc });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { _id, ...updateData } = body;

    if (!_id) {
      return NextResponse.json({ success: false, error: "Brand ID required" }, { status: 400 });
    }

    const updated = await Brand.findByIdAndUpdate(_id, updateData, { new: true });
    return NextResponse.json({ success: true, message: "Brand updated successfully", data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Brand ID required" }, { status: 400 });
    }

    await Brand.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Brand deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
