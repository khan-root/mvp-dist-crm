import { NextResponse } from "next/server";
import { BULK_TEMPLATES, generateCSVContent } from "@/lib/bulk-templates";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const entity = searchParams.get("entity") || "products";

    const template = BULK_TEMPLATES[entity];
    if (!template) {
      return NextResponse.json({ error: `Unknown template entity: ${entity}` }, { status: 400 });
    }

    const csvContent = generateCSVContent(template);

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${template.filename}"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to generate CSV template" }, { status: 500 });
  }
}
