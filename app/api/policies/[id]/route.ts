import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Policy } from "@/lib/models";
import { getSession } from "@/lib/auth";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const doc = await Policy.findOne({ _id: id, tenant_id: session.tenantId }).lean();
    if (!doc) return NextResponse.json({ error: "Policy not found" }, { status: 404 });

    return NextResponse.json({ data: doc });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to load policy" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    await dbConnect();

    if (body.is_default) {
      await Policy.updateMany({ tenant_id: session.tenantId, _id: { $ne: id } }, { is_default: false });
    }

    const updated = await Policy.findOneAndUpdate(
      { _id: id, tenant_id: session.tenantId },
      { $set: body },
      { new: true }
    ).lean();

    if (!updated) return NextResponse.json({ error: "Policy not found" }, { status: 404 });

    return NextResponse.json({ data: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to update policy" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const deleted = await Policy.findOneAndDelete({ _id: id, tenant_id: session.tenantId });
    if (!deleted) return NextResponse.json({ error: "Policy not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to delete policy" }, { status: 500 });
  }
}
