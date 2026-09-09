import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { DeliveryVehicle } from "@/lib/models";
import { requireSession } from "@/lib/auth";

const CreateVehicleSchema = z.object({
  vehicle_number: z.string().min(1),
  vehicle_type: z.enum(["truck", "trailer", "container", "tanker", "van", "tempo", "motorcycle", "bicycle"]).default("truck"),
  transporter_company: z.string().default("In-House Fleet"),
  capacity_tons: z.number().positive().default(20),
  driver_name: z.string().min(1),
  driver_phone: z.string().min(1),
  warehouse_id: z.string().optional(),
  status: z.enum(["active", "in_transit", "inactive", "maintenance"]).default("active"),
});

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const query: any = { tenant_id: session.tenantId, is_active: true };
    if (status && status !== "all") query.status = status;

    const vehicles = await DeliveryVehicle.find(query)
      .populate("warehouse_id", "warehouse_name warehouse_code")
      .sort({ created_at: -1 })
      .lean();

    return NextResponse.json({ data: vehicles });
  } catch (e: any) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: e?.message || "Failed to list supply chain vehicles" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const parsed = CreateVehicleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    await dbConnect();

    const {
      vehicle_number,
      vehicle_type,
      transporter_company,
      capacity_tons,
      driver_name,
      driver_phone,
      warehouse_id,
      status,
    } = parsed.data;

    const newVehicle = await DeliveryVehicle.create({
      tenant_id: session.tenantId,
      vehicle_number: vehicle_number.toUpperCase().trim(),
      vehicle_type,
      transporter_company,
      capacity_tons,
      capacity: {
        weight_kg: capacity_tons * 1000,
      },
      driver: {
        name: driver_name,
        phone: driver_phone,
      },
      warehouse_id: warehouse_id || undefined,
      status,
      is_active: true,
      created_by: session.userId,
    });

    return NextResponse.json({ data: newVehicle });
  } catch (e: any) {
    console.error("Vehicle API Error:", e);
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: e?.message || "Failed to register transport vehicle" }, { status: 500 });
  }
}
