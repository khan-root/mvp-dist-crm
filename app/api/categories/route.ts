import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Category, Tenant } from "@/lib/models";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const categories = await Category.find().sort({ category_name: 1 }).lean();
    return NextResponse.json({ success: true, data: categories });
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

    const doc = await Category.create({
      tenant_id: tenant._id,
      ...body,
    });

    return NextResponse.json({ success: true, message: "Category created successfully", data: doc });
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
      return NextResponse.json({ success: false, error: "Category ID required" }, { status: 400 });
    }

    const updated = await Category.findByIdAndUpdate(_id, updateData, { new: true });
    return NextResponse.json({ success: true, message: "Category updated successfully", data: updated });
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
      return NextResponse.json({ success: false, error: "Category ID required" }, { status: 400 });
    }

    await Category.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Category deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
