import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { AttendancePolicy, Tenant } from "@/lib/models";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const policies = await AttendancePolicy.find().sort({ created_at: -1 }).lean();
    return NextResponse.json({ success: true, data: policies });
  } catch (error: any) {
    console.error("Error fetching HR policies:", error);
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

    if (body.is_default) {
      await AttendancePolicy.updateMany({ tenant_id: tenant._id }, { is_default: false });
    }

    const policy = await AttendancePolicy.create({
      tenant_id: tenant._id,
      ...body,
    });

    return NextResponse.json({ success: true, message: "Attendance Policy Saved", data: policy });
  } catch (error: any) {
    console.error("Error creating HR policy:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { _id, ...updateData } = body;

    if (!_id) {
      return NextResponse.json({ success: false, error: "Policy ID required" }, { status: 400 });
    }

    if (updateData.is_default) {
      await AttendancePolicy.updateMany({ _id: { $ne: _id } }, { is_default: false });
    }

    const updated = await AttendancePolicy.findByIdAndUpdate(_id, updateData, { new: true });
    return NextResponse.json({ success: true, message: "Policy Updated Successfully", data: updated });
  } catch (error: any) {
    console.error("Error updating HR policy:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
