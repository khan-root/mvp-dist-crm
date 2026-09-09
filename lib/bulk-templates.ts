export interface EntityTemplate {
  key: string;
  label: string;
  filename: string;
  headers: string[];
  sampleRows: Record<string, string>[];
  requiredFields: string[];
}

export const BULK_TEMPLATES: Record<string, EntityTemplate> = {
  products: {
    key: "products",
    label: "Products & Master SKUs",
    filename: "products_import_template.csv",
    headers: [
      "product_name",
      "product_code",
      "sku",
      "unit_of_measure",
      "base_cost",
      "mrp",
      "wholesale_price",
      "retail_price",
      "current_stock",
      "minimum_stock",
      "category_name",
      "brand_name",
      "distributor_code",
    ],
    sampleRows: [
      {
        product_name: "Premium Wheat Flour 10kg",
        product_code: "PRD-FLR-001",
        sku: "SKU-FLR-10K",
        unit_of_measure: "bag",
        base_cost: "850",
        mrp: "1100",
        wholesale_price: "950",
        retail_price: "1050",
        current_stock: "250",
        minimum_stock: "20",
        category_name: "Grains & Staples",
        brand_name: "Khyber Foods",
        distributor_code: "DST-LHR-001",
      },
      {
        product_name: "Cooking Oil 5 Litre Tin",
        product_code: "PRD-OIL-005",
        sku: "SKU-OIL-5L",
        unit_of_measure: "tin",
        base_cost: "2200",
        mrp: "2600",
        wholesale_price: "2350",
        retail_price: "2500",
        current_stock: "100",
        minimum_stock: "15",
        category_name: "Oils & Ghee",
        brand_name: "Mehran Pure",
        distributor_code: "DST-KHI-001",
      },
    ],
    requiredFields: ["product_name", "product_code", "sku", "unit_of_measure", "base_cost", "mrp"],
  },

  agents: {
    key: "agents",
    label: "Field Agents & Bookers",
    filename: "field_agents_import_template.csv",
    headers: [
      "agent_code",
      "first_name",
      "last_name",
      "email",
      "phone",
      "distributor_code",
      "territory_name",
      "designation",
      "employment_type",
      "joining_date",
      "password",
      "province",
      "city",
    ],
    sampleRows: [
      {
        agent_code: "AGT-LHR-001",
        first_name: "Tariq",
        last_name: "Mehmood",
        email: "tariq.agent@company.com",
        phone: "+92 300 1122334",
        distributor_code: "DST-LHR-001",
        territory_name: "Lahore Central Zone",
        designation: "Order Booker",
        employment_type: "full_time",
        joining_date: "2024-01-15",
        password: "AgentPassword123",
        province: "Punjab",
        city: "Lahore",
      },
      {
        agent_code: "AGT-KHI-002",
        first_name: "Bilal",
        last_name: "Shah",
        email: "bilal.agent@company.com",
        phone: "+92 321 5566778",
        distributor_code: "DST-KHI-001",
        territory_name: "Karachi South Zone",
        designation: "Sales Officer",
        employment_type: "full_time",
        joining_date: "2024-02-01",
        password: "AgentPassword123",
        province: "Sindh",
        city: "Karachi",
      },
    ],
    requiredFields: ["agent_code", "first_name", "last_name", "email", "phone", "distributor_code", "territory_name"],
  },

  distributors: {
    key: "distributors",
    label: "Distributors & Hubs",
    filename: "distributors_import_template.csv",
    headers: [
      "company_name",
      "distributor_code",
      "industry_domain",
      "operating_model",
      "province",
      "city",
      "line1",
      "pincode",
      "phone",
      "email",
      "gst_number",
    ],
    sampleRows: [
      {
        company_name: "Khyber Allied Logistics",
        distributor_code: "DST-KPK-001",
        industry_domain: "fmcg",
        operating_model: "distributor",
        province: "Khyber Pakhtunkhwa",
        city: "Peshawar",
        line1: "Plot 14-B Industrial Estate",
        pincode: "25000",
        phone: "+92 300 9988776",
        email: "peshawar.hub@allied.com",
        gst_number: "07-01-2800-001-55",
      },
    ],
    requiredFields: ["company_name", "distributor_code", "province", "city", "phone", "email", "gst_number"],
  },

  stores: {
    key: "stores",
    label: "Retail Stores & Outlets",
    filename: "stores_import_template.csv",
    headers: [
      "store_name",
      "store_code",
      "owner_name",
      "phone",
      "email",
      "province",
      "city",
      "line1",
      "pincode",
      "territory_name",
    ],
    sampleRows: [
      {
        store_name: "Al-Madina General Store",
        store_code: "STR-LHR-101",
        owner_name: "Muhammad Usman",
        phone: "+92 300 4455667",
        email: "almadina.store@gmail.com",
        province: "Punjab",
        city: "Lahore",
        line1: "Main Market Commercial Area",
        pincode: "54000",
        territory_name: "Lahore Central Zone",
      },
    ],
    requiredFields: ["store_name", "store_code", "phone", "province", "city", "territory_name"],
  },

  territories: {
    key: "territories",
    label: "Territories & Zones",
    filename: "territories_import_template.csv",
    headers: ["territory_code", "territory_name", "province", "city", "region"],
    sampleRows: [
      {
        territory_code: "TR-LHR-01",
        territory_name: "Lahore Central Zone",
        province: "Punjab",
        city: "Lahore",
        region: "Central Punjab",
      },
    ],
    requiredFields: ["territory_code", "territory_name", "province", "city"],
  },

  routes: {
    key: "routes",
    label: "Sales Routes",
    filename: "sales_routes_import_template.csv",
    headers: ["route_code", "route_name", "territory_name", "start_point", "end_point", "distance_km"],
    sampleRows: [
      {
        route_code: "RT-LHR-A1",
        route_name: "Gulberg Commercial Route A",
        territory_name: "Lahore Central Zone",
        start_point: "Liberty Market Hub",
        end_point: "Main Boulevard Circle",
        distance_km: "12.5",
      },
    ],
    requiredFields: ["route_code", "route_name", "territory_name"],
  },
};

/** Utility to generate CSV text content for a template */
export function generateCSVContent(template: EntityTemplate): string {
  const headerRow = template.headers.join(",");
  const dataRows = template.sampleRows.map((row) =>
    template.headers.map((h) => `"${(row[h] || "").replace(/"/g, '""')}"`).join(",")
  );
  return [headerRow, ...dataRows].join("\n");
}

/** Simple, reliable CSV parser returning key-value object array */
export function parseCSVText(csvText: string): Record<string, string>[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  // Parse header
  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0 || (values.length === 1 && values[0].trim() === "")) continue;

    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h.trim()] = values[idx] !== undefined ? values[idx].trim() : "";
    });
    rows.push(rowObj);
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
