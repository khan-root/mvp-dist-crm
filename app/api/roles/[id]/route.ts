import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Role } from "@/lib/models";
import { requireSession } from "@/lib/auth";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await requireSession();
    await dbConnect();

    const role = await Role.findOne({ _id: id, tenant_id: session.tenantId }).lean();
    if (!role) return NextResponse.json({ error: "Role not found" }, { status: 404 });

    return NextResponse.json({ data: role });
  } catch (e) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: "Failed to fetch role" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await requireSession();
    const body = await request.json();

    await dbConnect();

    const updated = await Role.findOneAndUpdate(
      { _id: id, tenant_id: session.tenantId },
      { $set: body },
      { new: true }
    ).lean();

    if (!updated) return NextResponse.json({ error: "Role not found" }, { status: 404 });

    return NextResponse.json({ data: updated });
  } catch (e) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await requireSession();

    await dbConnect();

    const role = await Role.findOne({ _id: id, tenant_id: session.tenantId });
    if (!role) return NextResponse.json({ error: "Role not found" }, { status: 404 });

    if (role.code === "admin" || role.is_default) {
      return NextResponse.json({ error: "System default roles cannot be deleted" }, { status: 400 });
    }

    await Role.deleteOne({ _id: id, tenant_id: session.tenantId });

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: "Failed to delete role" }, { status: 500 });
  }
}
