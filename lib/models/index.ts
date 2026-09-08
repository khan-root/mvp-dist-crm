import mongoose from "mongoose";

const baseSchemaOptions = {
  timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
};

// ==================== TENANT ====================
const tenantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    company_name: { type: String, required: true },
    subdomain: { type: String, required: true, unique: true },
    custom_domain: String,
    logo_url: String,
    favicon_url: String,
    plan: {
      type: { type: String, enum: ["trial", "basic", "professional", "enterprise"], default: "trial" },
      features: { type: mongoose.Schema.Types.Mixed },
      billing_cycle: { type: String, enum: ["monthly", "quarterly", "yearly"] },
      subscription_status: { type: String, enum: ["active", "suspended", "cancelled", "expired"], default: "active" },
      plan_expiry: Date,
      trial_ends_at: Date,
    },
    settings: {
      timezone: { type: String, default: "UTC" },
      currency: { type: String, default: "PKR" },
      currency_symbol: { type: String, default: "Rs." },
      date_format: { type: String, default: "MM/DD/YYYY" },
      time_format: { type: String, default: "12h" },
      language: { type: String, default: "en" },
      notification_preferences: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        whatsapp: { type: Boolean, default: false },
        push: { type: Boolean, default: true },
      },
    },
    resource_limits: {
      max_agents: { type: Number, default: 5 },
      max_stores: { type: Number, default: 20 },
      max_products: { type: Number, default: 100 },
      max_warehouses: { type: Number, default: 1 },
      storage_gb: { type: Number, default: 1 },
      api_calls_per_day: { type: Number, default: 1000 },
    },
    usage_metrics: {
      current_agents: { type: Number, default: 0 },
      current_stores: { type: Number, default: 0 },
      current_products: { type: Number, default: 0 },
      current_warehouses: { type: Number, default: 0 },
      storage_used_mb: { type: Number, default: 0 },
      api_calls_today: { type: Number, default: 0 },
      last_calculated: Date,
    },
    branding: {
      primary_color: { type: String, default: "#1976d2" },
      secondary_color: { type: String, default: "#dc004e" },
      email_footer: String,
      login_page_text: String,
    },
    contact_info: {
      email: String,
      phone: String,
      address: String,
      gst_number: String,
      pan_number: String,
    },
    status: { type: String, enum: ["active", "inactive", "suspended"], default: "active" },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  baseSchemaOptions
);

// ==================== USER ====================
const userSchema = new mongoose.Schema(
  {
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    name: { type: String },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String, required: true },
    password_hash: { type: String, required: true },
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    profile_picture: String,
    domain_associations: [
      {
        domain_type: { type: String, enum: ["distributor", "agent", "store", "admin"] },
        domain_id: { type: mongoose.Schema.Types.ObjectId },
        role_id: { type: mongoose.Schema.Types.ObjectId, ref: "Role" },
        is_primary: { type: Boolean, default: false },
        is_active: { type: Boolean, default: true },
        joined_at: { type: Date, default: Date.now },
      },
    ],
    auth_provider: { type: String, enum: ["email", "google", "facebook", "apple"], default: "email" },
    social_id: String,
    email_verified: { type: Boolean, default: false },
    phone_verified: { type: Boolean, default: false },
    two_factor_enabled: { type: Boolean, default: false },
    two_factor_secret: String,
    login_attempts: { type: Number, default: 0 },
    lock_until: Date,
    refresh_tokens: [String],
    last_login: Date,
    last_login_ip: String,
    last_login_location: String,
    password_changed_at: Date,
    role_id: { type: mongoose.Schema.Types.ObjectId, ref: "Role" },
    preferences: {
      language: { type: String, default: "en" },
      theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
      },
      dashboard_layout: { type: mongoose.Schema.Types.Mixed },
    },
    status: { type: String, enum: ["active", "inactive", "suspended", "deleted"], default: "active" },
  },
  {
    ...baseSchemaOptions,
    indexes: [
      { email: 1, tenant_id: 1, unique: true },
      { phone: 1, tenant_id: 1, unique: true },
    ],
  }
);

// ==================== ROLE ====================
const roleSchema = new mongoose.Schema(
  {
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
    description: String,
    domain_type: { type: String, enum: ["distributor", "agent", "store", "system"] },
    permissions: {
      modules: [
        {
          module_name: String,
          actions: [String],
          conditions: { type: mongoose.Schema.Types.Mixed },
        },
      ],
      data_restrictions: {
        max_discount: Number,
        max_order_value: Number,
        allowed_territories: [String],
        allowed_product_categories: [String],
        view_cost_price: { type: Boolean, default: false },
        view_profit_margin: { type: Boolean, default: false },
      },
    },
    hierarchy: {
      level: { type: Number, default: 1 },
      parent_role_id: { type: mongoose.Schema.Types.ObjectId, ref: "Role" },
      is_system_role: { type: Boolean, default: false },
    },
    is_default: { type: Boolean, default: false },
    is_active: { type: Boolean, default: true },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { ...baseSchemaOptions, indexes: [{ tenant_id: 1, code: 1, unique: true }] }
);

// ==================== TERRITORY ====================
const territorySchema = new mongoose.Schema(
  {
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    territory_name: { type: String, required: true },
    territory_code: { type: String, required: true },
    description: String,
    geographic_boundaries: {
      type: { type: String, enum: ["Polygon", "MultiPolygon"] },
      coordinates: { type: mongoose.Schema.Types.Mixed },
    },
    pincodes: [String],
    cities: [String],
    states: [String],
    country: { type: String, default: "India" },
    target_stores: { type: Number, default: 0 },
    current_stores: { type: Number, default: 0 },
    assigned_manager_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    is_active: { type: Boolean, default: true },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { ...baseSchemaOptions, indexes: [{ tenant_id: 1, territory_code: 1, unique: true }] }
);

// ==================== DISTRIBUTOR ====================
const distributorSchema = new mongoose.Schema(
  {
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    company_name: { type: String, required: true },
    distributor_code: { type: String, required: true },
    business_license: String,
    gst_number: { type: String, required: true },
    pan_number: String,
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: "India" },
      latitude: Number,
      longitude: Number,
    },
    contact: {
      phone: { type: String, required: true },
      email: { type: String, required: true },
      website: String,
      alternate_phone: String,
    },
    business_details: {
      established_year: Number,
      business_type: { type: String, enum: ["wholesale", "retail", "distributor", "manufacturer"] },
      employee_count: Number,
      annual_turnover: Number,
      serviceable_pincodes: [String],
    },
    bank_details: {
      account_holder_name: String,
      account_number: String,
      bank_name: String,
      ifsc_code: String,
      branch: String,
      upi_id: String,
    },
    is_active: { type: Boolean, default: true },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    ...baseSchemaOptions,
    indexes: [
      { tenant_id: 1, distributor_code: 1, unique: true },
      { tenant_id: 1, gst_number: 1, unique: true },
    ],
  }
);

// ==================== AGENT ====================
const agentSchema = new mongoose.Schema(
  {
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    distributor_id: { type: mongoose.Schema.Types.ObjectId, ref: "Distributor", required: true },
    territory_id: { type: mongoose.Schema.Types.ObjectId, ref: "Territory", required: true },
    agent_code: { type: String, required: true },
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    personal_info: {
      phone: { type: String, required: true },
      email: { type: String, required: true },
      alternate_phone: String,
      date_of_birth: Date,
      gender: { type: String, enum: ["male", "female", "other"] },
      marital_status: { type: String, enum: ["single", "married", "divorced"] },
    },
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: "India" },
      latitude: Number,
      longitude: Number,
    },
    identification: {
      id_proof_type: { type: String, enum: ["aadhar", "pan", "voter", "driving_license"] },
      id_proof_number: String,
      id_proof_document: String,
      address_proof_type: String,
      address_proof_document: String,
    },
    employment: {
      joining_date: { type: Date, required: true },
      employment_type: { type: String, enum: ["full_time", "part_time", "contract"], default: "full_time" },
      designation: String,
      reporting_to: { type: mongoose.Schema.Types.ObjectId, ref: "Agent" },
      security_deposit: { type: Number, default: 0 },
      commission_rate: { type: Number, default: 0 },
    },
    targets: {
      monthly_sales: { type: Number, default: 0 },
      monthly_orders: { type: Number, default: 0 },
      monthly_visits: { type: Number, default: 20 },
      new_store_acquisition: { type: Number, default: 2 },
    },
    bank_details: {
      account_holder_name: String,
      account_number: String,
      bank_name: String,
      ifsc_code: String,
      upi_id: String,
    },
    documents: [
      {
        doc_type: String,
        doc_url: String,
        uploaded_at: Date,
        verified: { type: Boolean, default: false },
      },
    ],
    is_active: { type: Boolean, default: true },
    assigned_product_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    assigned_route_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "SalesRoute" }],
    assigned_store_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "Store" }],
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    ...baseSchemaOptions,
    indexes: [
      { tenant_id: 1, agent_code: 1, unique: true },
      { tenant_id: 1, "personal_info.email": 1 },
      { tenant_id: 1, "personal_info.phone": 1 },
    ],
  }
);

// ==================== STORE ====================
const storeSchema = new mongoose.Schema(
  {
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    distributor_id: { type: mongoose.Schema.Types.ObjectId, ref: "Distributor" },
    territory_id: { type: mongoose.Schema.Types.ObjectId, ref: "Territory" },
    assigned_agent_id: { type: mongoose.Schema.Types.ObjectId, ref: "Agent" },
    assigned_route_id: { type: mongoose.Schema.Types.ObjectId, ref: "SalesRoute" },
    store_code: { type: String, required: true },
    store_name: { type: String, required: true },
    store_type: {
      type: String,
      enum: ["kirana", "supermarket", "departmental", "pharmacy", "electronics", "clothing", "other"],
      required: true,
    },
    owner_info: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: String,
      alternate_phone: String,
    },
    address: {
      line1: { type: String, required: true },
      line2: String,
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: "India" },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      landmark: String,
    },
    business_info: {
      gst_number: String,
      pan_number: String,
      established_date: Date,
      store_size_sqft: Number,
      monthly_turnover: Number,
      employee_count: Number,
      business_hours: {
        monday: { open: String, close: String },
        tuesday: { open: String, close: String },
        wednesday: { open: String, close: String },
        thursday: { open: String, close: String },
        friday: { open: String, close: String },
        saturday: { open: String, close: String },
        sunday: { open: String, close: String, closed: { type: Boolean, default: true } },
      },
    },
    credit_info: {
      credit_limit: { type: Number, default: 0 },
      credit_days: { type: Number, default: 0 },
      used_credit: { type: Number, default: 0 },
      available_credit: { type: Number, default: 0 },
      payment_terms: {
        type: String,
        enum: ["cash", "credit_7", "credit_15", "credit_30", "credit_45"],
        default: "cash",
      },
      credit_rating: { type: String, enum: ["excellent", "good", "average", "poor"], default: "average" },
    },
    documents: [
      {
        doc_type: String,
        doc_url: String,
        uploaded_at: Date,
        verified: { type: Boolean, default: false },
      },
    ],
    photos: [{ url: String, category: String, uploaded_at: Date }],
    onboarding_date: { type: Date, default: Date.now },
    last_visit_date: Date,
    last_order_date: Date,
    is_active: { type: Boolean, default: true },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    ...baseSchemaOptions,
    indexes: [
      { tenant_id: 1, store_code: 1, unique: true },
      { tenant_id: 1, "owner_info.phone": 1 },
    ],
  }
);

// ==================== CATEGORY ====================
const categorySchema = new mongoose.Schema(
  {
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    distributor_id: { type: mongoose.Schema.Types.ObjectId, ref: "Distributor", required: true },
    category_name: { type: String, required: true },
    category_code: { type: String, required: true },
    description: String,
    parent_category_id: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
    level: { type: Number, default: 1 },
    path: String,
    image_url: String,
    icon_url: String,
    sort_order: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    ...baseSchemaOptions,
    indexes: [
      { tenant_id: 1, distributor_id: 1, category_code: 1, unique: true },
      { path: 1 },
    ],
  }
);

// ==================== BRAND ====================
const brandSchema = new mongoose.Schema(
  {
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    distributor_id: { type: mongoose.Schema.Types.ObjectId, ref: "Distributor", required: true },
    brand_name: { type: String, required: true },
    brand_code: { type: String, required: true },
    description: String,
    logo_url: String,
    website: String,
    brand_details: {
      manufacturer: String,
      country_of_origin: String,
      established_year: Number,
      certifications: [String],
    },
    is_active: { type: Boolean, default: true },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { ...baseSchemaOptions, indexes: [{ tenant_id: 1, distributor_id: 1, brand_code: 1, unique: true }] }
);

// ==================== PRODUCT ====================
const productSchema = new mongoose.Schema(
  {
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    distributor_id: { type: mongoose.Schema.Types.ObjectId, ref: "Distributor", required: true },
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    brand_id: { type: mongoose.Schema.Types.ObjectId, ref: "Brand", required: true },
    product_name: { type: String, required: true },
    product_code: { type: String, required: true },
    sku: { type: String, required: true },
    barcode: { type: String, sparse: true },
    hsn_code: String,
    description: String,
    short_description: String,
    specifications: { type: mongoose.Schema.Types.Mixed },
    unit_of_measure: { type: String, required: true },
    packaging: {
      type: { type: String, enum: ["piece", "box", "carton", "packet", "bottle"] },
      quantity_per_case: Number,
      weight: Number,
      weight_unit: { type: String, enum: ["g", "kg", "lb"], default: "g" },
    },
    images: [
      {
        url: String,
        is_primary: { type: Boolean, default: false },
        sort_order: Number,
      },
    ],
    pricing: {
      base_cost: { type: Number, required: true, min: 0 },
      mrp: { type: Number, required: true, min: 0 },
      wholesale_price: Number,
      retail_price: Number,
      gst_rate: { type: Number, default: 0 },
      cess: { type: Number, default: 0 },
    },
    inventory: {
      current_stock: { type: Number, default: 0 },
      minimum_stock: { type: Number, default: 0 },
      maximum_stock: { type: Number, default: 0 },
      reorder_level: { type: Number, default: 0 },
      reorder_quantity: { type: Number, default: 0 },
      lead_time_days: { type: Number, default: 0 },
    },
    status: {
      is_active: { type: Boolean, default: true },
      is_featured: { type: Boolean, default: false },
      is_new: { type: Boolean, default: false },
      is_on_sale: { type: Boolean, default: false },
    },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    ...baseSchemaOptions,
    indexes: [
      { tenant_id: 1, product_code: 1, unique: true },
      { tenant_id: 1, sku: 1, unique: true },
      { tenant_id: 1, barcode: 1, unique: true, sparse: true },
    ],
  }
);

// ==================== PRODUCT VARIANT ====================
const productVariantSchema = new mongoose.Schema(
  {
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    variant_name: { type: String, required: true },
    variant_sku: { type: String, required: true, unique: true },
    variant_barcode: { type: String, unique: true, sparse: true },
    attributes: {
      size: String,
      color: String,
      flavor: String,
      style: String,
      material: String,
      custom_attributes: { type: mongoose.Schema.Types.Mixed },
    },
    pricing: {
      cost_adjustment: { type: Number, default: 0 },
      price_adjustment: { type: Number, default: 0 },
      mrp: Number,
    },
    inventory: {
      quantity: { type: Number, default: 0 },
      reserved_quantity: { type: Number, default: 0 },
      available_quantity: { type: Number, default: 0 },
    },
    images: [String],
    is_active: { type: Boolean, default: true },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  baseSchemaOptions
);

// ==================== WAREHOUSE ====================
const warehouseSchema = new mongoose.Schema(
  {
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    distributor_id: { type: mongoose.Schema.Types.ObjectId, ref: "Distributor", required: true },
    warehouse_name: { type: String, required: true },
    warehouse_code: { type: String, required: true },
    address: {
      line1: { type: String, required: true },
      line2: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: "India" },
      latitude: Number,
      longitude: Number,
    },
    contact: {
      manager_name: String,
      phone: String,
      email: String,
    },
    capacity: {
      total_area_sqft: Number,
      utilized_area_sqft: Number,
      max_pallets: Number,
      current_pallets: Number,
      temperature_controlled: { type: Boolean, default: false },
      min_temperature: Number,
      max_temperature: Number,
    },
    operating_hours: {
      monday: { open: String, close: String, closed: Boolean },
      tuesday: { open: String, close: String, closed: Boolean },
      wednesday: { open: String, close: String, closed: Boolean },
      thursday: { open: String, close: String, closed: Boolean },
      friday: { open: String, close: String, closed: Boolean },
      saturday: { open: String, close: String, closed: Boolean },
      sunday: { open: String, close: String, closed: { type: Boolean, default: true } },
    },
    is_active: { type: Boolean, default: true },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { ...baseSchemaOptions, indexes: [{ tenant_id: 1, warehouse_code: 1, unique: true }] }
);

// ==================== BATCH ====================
const batchSchema = new mongoose.Schema(
  {
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    variant_id: { type: mongoose.Schema.Types.ObjectId, ref: "ProductVariant" },
    warehouse_id: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", required: true },
    batch_number: { type: String, required: true },
    supplier_batch_number: String,
    manufacturing_date: Date,
    expiry_date: { type: Date, required: true, index: true },
    best_before_date: Date,
    quantities: {
      initial: { type: Number, required: true },
      current: { type: Number, required: true },
      reserved: { type: Number, default: 0 },
      damaged: { type: Number, default: 0 },
      returned: { type: Number, default: 0 },
    },
    cost: {
      unit_cost: { type: Number, required: true },
      total_cost: { type: Number, required: true },
      landed_cost: Number,
    },
    quality: {
      status: {
        type: String,
        enum: ["good", "damaged", "expired", "quarantine", "returned"],
        default: "good",
      },
      checked_by: String,
      checked_at: Date,
      remarks: String,
    },
    location: { zone: String, rack: String, shelf: String, bin: String },
    received_date: { type: Date, default: Date.now },
    received_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    is_active: { type: Boolean, default: true },
  },
  {
    ...baseSchemaOptions,
    indexes: [
      { tenant_id: 1, product_id: 1, warehouse_id: 1, batch_number: 1, unique: true },
      { expiry_date: 1 },
    ],
  }
);

// ==================== INVENTORY ====================
const inventorySchema = new mongoose.Schema(
  {
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    warehouse_id: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", required: true },
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    variant_id: { type: mongoose.Schema.Types.ObjectId, ref: "ProductVariant" },
    quantities: {
      current: { type: Number, required: true, default: 0, min: 0 },
      reserved: { type: Number, default: 0, min: 0 },
      available: { type: Number, default: 0, min: 0 },
      damaged: { type: Number, default: 0, min: 0 },
      returned: { type: Number, default: 0, min: 0 },
      on_order: { type: Number, default: 0, min: 0 },
    },
    thresholds: {
      minimum: { type: Number, default: 0 },
      maximum: { type: Number, default: 0 },
      reorder_level: { type: Number, default: 0 },
      reorder_quantity: { type: Number, default: 0 },
    },
    costing: {
      average_cost: { type: Number, default: 0 },
      last_purchase_cost: Number,
      last_purchase_date: Date,
      moving_average_cost: { type: Number, default: 0 },
    },
    location: { zone: String, rack: String, shelf: String, bin: String },
    last_counted_at: Date,
    last_updated_at: { type: Date, default: Date.now },
    last_updated_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    ...baseSchemaOptions,
    indexes: [{ tenant_id: 1, warehouse_id: 1, product_id: 1, variant_id: 1, unique: true }],
  }
);

// ==================== STOCK MOVEMENT ====================
const stockMovementSchema = new mongoose.Schema(
  {
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    movement_type: {
      type: String,
      enum: [
        "purchase_receipt",
        "sales_issue",
        "sales_return",
        "transfer_in",
        "transfer_out",
        "adjustment_in",
        "adjustment_out",
        "damage",
        "expiry",
        "production",
        "consumption",
      ],
      required: true,
    },
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    variant_id: { type: mongoose.Schema.Types.ObjectId, ref: "ProductVariant" },
    batch_id: { type: mongoose.Schema.Types.ObjectId, ref: "Batch" },
    from_warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse" },
    to_warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse" },
    quantity: { type: Number, required: true },
    previous_stock: Number,
    new_stock: Number,
    unit_cost: Number,
    total_cost: Number,
    reference: {
      type: { type: String, enum: ["order", "purchase", "transfer", "adjustment", "return"] },
      id: { type: mongoose.Schema.Types.ObjectId },
      number: String,
    },
    reason: String,
    notes: String,
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    movement_date: { type: Date, default: Date.now },
  },
  {
    ...baseSchemaOptions,
    indexes: [
      { tenant_id: 1, product_id: 1, created_at: -1 },
      { tenant_id: 1, to_warehouse: 1, created_at: -1 },
      { tenant_id: 1, from_warehouse: 1, created_at: -1 },
    ],
  }
);

// ==================== PRICE LIST ====================
const priceListSchema = new mongoose.Schema(
  {
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    list_type: { type: String, enum: ["distributor", "agent", "retail"] },
    owner_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    owner_type: { type: String, enum: ["Distributor", "Agent", "Store"] },
    name: { type: String, required: true },
    code: { type: String, required: true },
    base_price_list_id: { type: mongoose.Schema.Types.ObjectId, ref: "PriceList" },
    margin_percentage: Number,
    markup_percentage: Number,
    effective_from: { type: Date, required: true },
    effective_to: Date,
    is_default: { type: Boolean, default: false },
    is_active: { type: Boolean, default: true },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { ...baseSchemaOptions, indexes: [{ tenant_id: 1, code: 1, unique: true }] }
);

// ==================== PRICE LIST ITEM ====================
const priceListItemSchema = new mongoose.Schema(
  {
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    price_list_id: { type: mongoose.Schema.Types.ObjectId, ref: "PriceList", required: true },
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    variant_id: { type: mongoose.Schema.Types.ObjectId, ref: "ProductVariant" },
    price: { type: Number, required: true, min: 0 },
    cost_price: Number,
    discount: {
      type: { type: String, enum: ["percentage", "fixed", "none"], default: "none" },
      value: { type: Number, default: 0 },
      min_quantity: { type: Number, default: 1 },
      max_quantity: Number,
    },
    min_quantity: { type: Number, default: 1 },
    max_quantity: Number,
    is_active: { type: Boolean, default: true },
    updated_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    ...baseSchemaOptions,
    indexes: [{ price_list_id: 1, product_id: 1, variant_id: 1, unique: true }],
  }
);

// ==================== PRICING RULE ====================
const pricingRuleSchema = new mongoose.Schema(
  {
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    rule_name: { type: String, required: true },
    rule_code: { type: String, required: true },
    applicability: {
      customer_types: [String],
      customer_ids: [{ type: mongoose.Schema.Types.ObjectId }],
      products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
      categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
      brands: [{ type: mongoose.Schema.Types.ObjectId, ref: "Brand" }],
      min_quantity: Number,
      max_quantity: Number,
      min_order_value: Number,
      days_of_week: [Number],
      time_range: { start: String, end: String },
      date_range: { start: Date, end: Date },
    },
    pricing_action: {
      type: { type: String, enum: ["fixed", "percentage_discount", "amount_discount", "tiered"] },
      value: { type: mongoose.Schema.Types.Mixed },
    },
    priority: { type: Number, default: 0 },
    stackable: { type: Boolean, default: false },
    approval_required: { type: Boolean, default: false },
    max_discount_percentage: Number,
    is_active: { type: Boolean, default: true },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { ...baseSchemaOptions, indexes: [{ tenant_id: 1, rule_code: 1, unique: true }] }
);

// ==================== ORDER ====================
const orderSchema = new mongoose.Schema(
  {
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    order_number: { type: String, required: true, unique: true },
    order_type: { type: String, enum: ["store_order", "agent_order", "distributor_order"], required: true },
    from_type: { type: String, enum: ["store", "agent", "distributor"] },
    from_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    to_type: { type: String, enum: ["agent", "distributor", "store"] },
    to_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    source_order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    agent_id: { type: mongoose.Schema.Types.ObjectId, ref: "Agent" },
    store_id: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },
    distributor_id: { type: mongoose.Schema.Types.ObjectId, ref: "Distributor" },
    order_date: { type: Date, required: true, default: Date.now },
    required_date: Date,
    items: [
      {
        product_id: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        variant_id: { type: mongoose.Schema.Types.ObjectId, ref: "ProductVariant" },
        batch_id: { type: mongoose.Schema.Types.ObjectId, ref: "Batch" },
        quantity: { type: Number, required: true, min: 1 },
        unit_price: { type: Number, required: true },
        cost_price: Number,
        discount_percentage: Number,
        discount_amount: Number,
        tax_rate: Number,
        tax_amount: Number,
        total: Number,
        notes: String,
      },
    ],
    subtotal: { type: Number, required: true },
    discount_total: { type: Number, default: 0 },
    tax_total: { type: Number, default: 0 },
    shipping_charges: { type: Number, default: 0 },
    handling_charges: { type: Number, default: 0 },
    round_off: { type: Number, default: 0 },
    grand_total: { type: Number, required: true },
    paid_amount: { type: Number, default: 0 },
    due_amount: { type: Number, default: 0 },
    payment_status: { type: String, enum: ["pending", "partial", "completed", "refunded"], default: "pending" },
    payment_method: { type: String, enum: ["cash", "card", "upi", "bank_transfer", "wallet", "credit"] },
    payment_details: [
      {
        method: String,
        amount: Number,
        reference: String,
        transaction_id: String,
        paid_at: Date,
        status: String,
      },
    ],
    delivery_address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
      latitude: Number,
      longitude: Number,
      contact_person: String,
      contact_phone: String,
    },
    delivery_status: {
      type: String,
      enum: ["pending", "processing", "shipped", "out_for_delivery", "delivered", "failed", "returned"],
      default: "pending",
    },
    expected_delivery: Date,
    actual_delivery: Date,
    delivered_to: String,
    delivery_notes: String,
    delivery_tracking: [
      {
        status: String,
        location: String,
        timestamp: Date,
        updated_by: String,
      },
    ],
    status: {
      type: String,
      enum: ["draft", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"],
      default: "draft",
    },
    status_history: [
      {
        status: String,
        changed_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        changed_at: { type: Date, default: Date.now },
        reason: String,
      },
    ],
    requires_approval: { type: Boolean, default: false },
    approval_status: { type: String, enum: ["pending", "approved", "rejected"] },
    approved_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approved_at: Date,
    rejection_reason: String,
    source: { type: String, enum: ["app", "web", "whatsapp", "phone", "manual"] },
    notes: String,
    tags: [String],
    credit_note_id: { type: mongoose.Schema.Types.ObjectId, ref: "CreditNote" },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updated_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    ...baseSchemaOptions,
    indexes: [
      { tenant_id: 1, order_number: 1, unique: true },
      { tenant_id: 1, from_id: 1, order_date: -1 },
      { tenant_id: 1, to_id: 1, order_date: -1 },
      { tenant_id: 1, agent_id: 1, order_date: -1 },
      { tenant_id: 1, store_id: 1, order_date: -1 },
      { tenant_id: 1, status: 1, order_date: -1 },
    ],
  }
);

// ==================== CREDIT NOTE ====================
const creditNoteSchema = new mongoose.Schema(
  {
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    credit_note_number: { type: String, required: true, unique: true },
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    type: { type: String, enum: ["return", "damage", "shortage", "price_adjustment", "other"], required: true },
    reason: { type: String, required: true },
    items: [
      {
        product_id: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        variant_id: { type: mongoose.Schema.Types.ObjectId, ref: "ProductVariant" },
        quantity: Number,
        unit_price: Number,
        total: Number,
        reason: String,
      },
    ],
    subtotal: Number,
    tax_adjustment: Number,
    total_amount: Number,
    status: { type: String, enum: ["draft", "issued", "applied", "cancelled"], default: "draft" },
    applied_to: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    applied_at: Date,
    issued_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    issued_at: { type: Date, default: Date.now },
    notes: String,
  },
  baseSchemaOptions
);

// ==================== PAYMENT ====================
const paymentSchema = new mongoose.Schema(
  {
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    payment_number: { type: String, required: true, unique: true },
    payment_type: { type: String, enum: ["incoming", "outgoing"] },
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    party_type: { type: String, enum: ["store", "agent", "distributor"] },
    party_id: { type: mongoose.Schema.Types.ObjectId },
    amount: { type: Number, required: true },
    payment_method: {
      type: String,
      enum: ["cash", "card", "upi", "bank_transfer", "cheque", "wallet"],
      required: true,
    },
    reference_number: String,
    transaction_id: String,
    payment_date: { type: Date, required: true, default: Date.now },
    status: { type: String, enum: ["pending", "completed", "failed", "refunded"], default: "pending" },
    bank_details: {
      bank_name: String,
      account_number: String,
      ifsc_code: String,
      branch: String,
    },
    notes: String,
    receipt_url: String,
    recorded_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    verified_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    verified_at: Date,
  },
  baseSchemaOptions
);

// ==================== COMMISSION ====================
const commissionSchema = new mongoose.Schema(
  {
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    agent_id: { type: mongoose.Schema.Types.ObjectId, ref: "Agent", required: true },
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    commission_type: { type: String, enum: ["percentage", "fixed"], required: true },
    commission_rate: { type: Number, required: true },
    commission_amount: { type: Number, required: true },
    basis_amount: Number,
    status: { type: String, enum: ["calculated", "approved", "paid", "cancelled"], default: "calculated" },
    calculated_date: { type: Date, default: Date.now },
    approved_date: Date,
    paid_date: Date,
    payment_id: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    notes: String,
  },
  baseSchemaOptions
);

// ==================== STORE VISIT ====================
const storeVisitSchema = new mongoose.Schema(
  {
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    agent_id: { type: mongoose.Schema.Types.ObjectId, ref: "Agent", required: true },
    store_id: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    visit_date: { type: Date, required: true, default: Date.now },
    check_in_time: { type: Date, required: true },
    check_out_time: Date,
    location: {
      check_in_lat: Number,
      check_in_lng: Number,
      check_out_lat: Number,
      check_out_lng: Number,
      accuracy: Number,
    },
    visit_type: {
      type: String,
      enum: ["scheduled", "emergency", "follow_up", "collection"],
      default: "scheduled",
    },
    visit_status: {
      type: String,
      enum: ["planned", "in_progress", "completed", "cancelled"],
      default: "planned",
    },
    activities: [
      {
        type: {
          type: String,
          enum: [
            "order_taken",
            "payment_collected",
            "promotion_discussed",
            "inventory_checked",
            "issue_resolved",
            "new_products_pitched",
          ],
        },
        description: String,
        outcome: String,
        timestamp: Date,
      },
    ],
    photos: [{ url: String, caption: String, category: String, taken_at: Date }],
    orders_taken: [
      {
        order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
        order_number: String,
        amount: Number,
      },
    ],
    payments_collected: [
      {
        payment_id: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
        amount: Number,
      },
    ],
    feedback: {
      store_satisfaction: { type: Number, min: 1, max: 5 },
      issues_reported: String,
      suggestions: String,
      next_visit_date: Date,
    },
    summary: String,
    follow_up_required: { type: Boolean, default: false },
    follow_up_notes: String,
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  {
    ...baseSchemaOptions,
    indexes: [
      { tenant_id: 1, agent_id: 1, visit_date: -1 },
      { tenant_id: 1, store_id: 1, visit_date: -1 },
      { tenant_id: 1, visit_status: 1, visit_date: -1 },
    ],
  }
);

// ==================== PROMOTION ====================
const promotionSchema = new mongoose.Schema(
  {
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    promotion_name: { type: String, required: true },
    promotion_code: { type: String, required: true, unique: true },
    type: {
      type: String,
      enum: ["discount", "bogo", "combo", "volume", "seasonal", "loyalty"],
      required: true,
    },
    description: String,
    rules: {
      discount_type: { type: String, enum: ["percentage", "fixed", "free_product"] },
      discount_value: Number,
      min_purchase: Number,
      max_discount: Number,
      applicable_products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
      applicable_categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
      applicable_brands: [{ type: mongoose.Schema.Types.ObjectId, ref: "Brand" }],
      excluded_products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
      buy_quantity: Number,
      get_quantity: Number,
      free_product_id: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    },
    target_audience: {
      customer_types: [String],
      customer_ids: [{ type: mongoose.Schema.Types.ObjectId }],
      territories: [String],
      loyalty_tiers: [String],
    },
    schedule: {
      start_date: { type: Date, required: true },
      end_date: { type: Date, required: true },
      days_of_week: [Number],
      time_slots: [{ start: String, end: String }],
    },
    budget: {
      total: Number,
      used: { type: Number, default: 0 },
      per_customer: Number,
    },
    redemptions: {
      limit: Number,
      per_customer: Number,
      current: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ["draft", "active", "paused", "expired", "cancelled"],
      default: "draft",
    },
    performance: {
      views: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      redemptions: { type: Number, default: 0 },
      revenue_generated: { type: Number, default: 0 },
    },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    ...baseSchemaOptions,
    indexes: [
      { tenant_id: 1, promotion_code: 1, unique: true },
      { tenant_id: 1, status: 1 },
    ],
  }
);

// ==================== LOYALTY POINTS ====================
const loyaltyPointsSchema = new mongoose.Schema(
  {
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    owner_type: { type: String, enum: ["store", "agent", "customer"], required: true },
    owner_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    points_earned: { type: Number, default: 0 },
    points_redeemed: { type: Number, default: 0 },
    current_balance: { type: Number, default: 0 },
    tier: { type: String, enum: ["bronze", "silver", "gold", "platinum"], default: "bronze" },
    tier_updated_at: Date,
    transactions: [
      {
        transaction_type: { type: String, enum: ["earn", "redeem", "expire", "adjust"] },
        points: Number,
        reference: { type: mongoose.Schema.Types.ObjectId },
        reference_type: String,
        description: String,
        balance_after: Number,
        created_at: { type: Date, default: Date.now },
      },
    ],
    last_updated: { type: Date, default: Date.now },
  },
  {
    ...baseSchemaOptions,
    indexes: [{ tenant_id: 1, owner_type: 1, owner_id: 1, unique: true }],
  }
);

// ==================== NOTIFICATION ====================
const notificationSchema = new mongoose.Schema(
  {
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: { type: String, enum: ["info", "success", "warning", "error", "promotion"], default: "info" },
    category: { type: String, enum: ["order", "payment", "visit", "promotion", "system"] },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    data: { type: mongoose.Schema.Types.Mixed },
    action_url: String,
    image_url: String,
    is_read: { type: Boolean, default: false },
    read_at: Date,
    sent_at: { type: Date, default: Date.now },
    expires_at: Date,
  },
  {
    ...baseSchemaOptions,
    indexes: [{ tenant_id: 1, user_id: 1, is_read: 1, sent_at: -1 }],
  }
);

// ==================== ANALYTICS ====================
const analyticsSchema = new mongoose.Schema(
  {
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    entity_type: { type: String, enum: ["distributor", "agent", "store", "product"] },
    entity_id: { type: mongoose.Schema.Types.ObjectId },
    date: { type: Date, required: true },
    metrics: { type: mongoose.Schema.Types.Mixed },
    period: { type: String, enum: ["daily", "weekly", "monthly", "quarterly", "yearly"] },
    generated_at: { type: Date, default: Date.now },
  },
  {
    ...baseSchemaOptions,
    indexes: [{ tenant_id: 1, entity_type: 1, entity_id: 1, date: 1, unique: true }],
  }
);

// ==================== DELIVERY VEHICLE ====================
const deliveryVehicleSchema = new mongoose.Schema(
  {
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    distributor_id: { type: mongoose.Schema.Types.ObjectId, ref: "Distributor", required: true },
    vehicle_number: { type: String, required: true, unique: true },
    vehicle_type: {
      type: String,
      enum: ["truck", "van", "tempo", "motorcycle", "bicycle"],
      required: true,
    },
    driver: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      license_number: String,
      alternate_phone: String,
    },
    capacity: {
      weight_kg: { type: Number, required: true },
      volume_cubic_m: Number,
      max_packages: Number,
    },
    documents: {
      insurance: { number: String, expiry_date: Date, document_url: String },
      registration: { number: String, expiry_date: Date, document_url: String },
      permit: { number: String, valid_upto: Date, document_url: String },
    },
    status: { type: String, enum: ["active", "inactive", "maintenance"], default: "active" },
    last_maintenance: Date,
    next_maintenance: Date,
    current_location: {
      latitude: Number,
      longitude: Number,
      updated_at: Date,
    },
    is_active: { type: Boolean, default: true },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  baseSchemaOptions
);

// ==================== DELIVERY ROUTE ====================
const deliveryRouteSchema = new mongoose.Schema(
  {
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    route_name: { type: String, required: true },
    route_date: { type: Date, required: true },
    vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: "DeliveryVehicle", required: true },
    driver_name: String,
    driver_phone: String,
    stops: [
      {
        store_id: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },
        order_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
        sequence: Number,
        estimated_arrival: Date,
        actual_arrival: Date,
        estimated_departure: Date,
        actual_departure: Date,
        status: { type: String, enum: ["pending", "reached", "completed", "skipped"] },
        notes: String,
      },
    ],
    start_location: { latitude: Number, longitude: Number, address: String },
    end_location: { latitude: Number, longitude: Number, address: String },
    total_distance_km: Number,
    estimated_duration_minutes: Number,
    actual_duration_minutes: Number,
    status: {
      type: String,
      enum: ["planned", "in_progress", "completed", "cancelled"],
      default: "planned",
    },
    tracking: [{ latitude: Number, longitude: Number, timestamp: Date }],
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  baseSchemaOptions
);

// ==================== DELIVERY ====================
const deliverySchema = new mongoose.Schema(
  {
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    delivery_number: { type: String, required: true, unique: true },
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: "DeliveryVehicle" },
    route_id: { type: mongoose.Schema.Types.ObjectId, ref: "DeliveryRoute" },
    scheduled_date: { type: Date, required: true },
    scheduled_slot: { start: String, end: String },
    assigned_driver: { name: String, phone: String },
    pickup: {
      warehouse_id: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse" },
      address: String,
      contact_person: String,
      contact_phone: String,
      scheduled_time: Date,
      actual_time: Date,
      verified_by: String,
    },
    drop: {
      store_id: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },
      address: String,
      contact_person: String,
      contact_phone: String,
      scheduled_time: Date,
      actual_time: Date,
      received_by: String,
      signature_url: String,
      photo_url: String,
    },
    tracking: [
      {
        status: String,
        location: { latitude: Number, longitude: Number, address: String },
        timestamp: Date,
        updated_by: String,
      },
    ],
    status: {
      type: String,
      enum: [
        "scheduled",
        "assigned",
        "picked_up",
        "in_transit",
        "out_for_delivery",
        "delivered",
        "failed",
        "returned",
      ],
      default: "scheduled",
    },
    proof_of_delivery: { signature: String, photo: String, notes: String },
    issues: [
      {
        type: String,
        description: String,
        reported_at: Date,
        resolved_at: Date,
        resolution: String,
      },
    ],
    estimated_distance_km: Number,
    actual_distance_km: Number,
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  baseSchemaOptions
);

// ==================== INTEGRATION ====================
const integrationSchema = new mongoose.Schema(
  {
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    integration_name: { type: String, required: true },
    integration_type: {
      type: String,
      enum: ["erp", "accounting", "crm", "payment_gateway", "sms", "email", "whatsapp", "pos"],
      required: true,
    },
    provider: String,
    configuration: {
      api_key: String,
      api_secret: String,
      endpoint: String,
      webhook_url: String,
      username: String,
      password: String,
      additional_settings: { type: mongoose.Schema.Types.Mixed },
    },
    status: { type: String, enum: ["active", "inactive", "failed"], default: "active" },
    last_sync: Date,
    last_sync_status: String,
    error_log: [
      {
        timestamp: Date,
        error: String,
        resolved: { type: Boolean, default: false },
      },
    ],
    sync_settings: {
      auto_sync: { type: Boolean, default: false },
      sync_frequency: { type: String, enum: ["realtime", "hourly", "daily"] },
      last_sync_request: Date,
      next_sync: Date,
    },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  baseSchemaOptions
);

// ==================== AUDIT LOG ====================
const auditLogSchema = new mongoose.Schema(
  {
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    user: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      email: String,
      name: String,
      role: String,
    },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entity_id: { type: mongoose.Schema.Types.ObjectId },
    changes: [
      {
        field: String,
        old_value: mongoose.Schema.Types.Mixed,
        new_value: mongoose.Schema.Types.Mixed,
      },
    ],
    ip_address: String,
    user_agent: String,
    location: String,
    status: { type: String, enum: ["success", "failure"] },
    error: String,
    metadata: { type: mongoose.Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { ...baseSchemaOptions, capped: { size: 1073741824 } }
);

// ==================== SYSTEM CONFIG ====================
const systemConfigSchema = new mongoose.Schema(
  {
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, unique: true },
    features: {
      enabled: [String],
      disabled: [String],
      beta_features: [String],
      feature_flags: { type: mongoose.Schema.Types.Mixed },
    },
    workflows: {
      order_approval: {
        enabled: Boolean,
        thresholds: { type: mongoose.Schema.Types.Mixed },
        approvers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      },
      credit_limit: {
        enabled: Boolean,
        auto_approve: Boolean,
        max_auto_amount: Number,
      },
      inventory_alerts: {
        enabled: Boolean,
        thresholds: { type: mongoose.Schema.Types.Mixed },
        notification_channels: [String],
      },
    },
    security: {
      password_policy: {
        min_length: { type: Number, default: 8 },
        require_uppercase: { type: Boolean, default: true },
        require_lowercase: { type: Boolean, default: true },
        require_numbers: { type: Boolean, default: true },
        require_symbols: { type: Boolean, default: true },
        expiry_days: { type: Number, default: 90 },
      },
      session_timeout_minutes: { type: Number, default: 30 },
      max_login_attempts: { type: Number, default: 5 },
      lockout_duration_minutes: { type: Number, default: 30 },
      require_2fa: { type: Boolean, default: false },
      allowed_ips: [String],
      allowed_domains: [String],
    },
    backup: {
      enabled: { type: Boolean, default: true },
      frequency: { type: String, enum: ["daily", "weekly"], default: "daily" },
      retention_days: { type: Number, default: 30 },
      last_backup: Date,
      backup_location: String,
    },
    updated_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  baseSchemaOptions
);

// ==================== API KEY ====================
const apiKeySchema = new mongoose.Schema(
  {
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    name: { type: String, required: true },
    key: { type: String, required: true, unique: true },
    secret: { type: String, required: true },
    permissions: [String],
    ip_whitelist: [String],
    rate_limits: {
      per_minute: { type: Number, default: 60 },
      per_hour: { type: Number, default: 1000 },
      per_day: { type: Number, default: 10000 },
    },
    expires_at: Date,
    last_used: Date,
    usage: {
      total_requests: { type: Number, default: 0 },
      total_bytes: { type: Number, default: 0 },
      last_hour_requests: { type: Number, default: 0 },
      last_hour_reset: Date,
    },
    is_active: { type: Boolean, default: true },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  baseSchemaOptions
);

const salesRouteSchema = new mongoose.Schema(
  {
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    territory_id: { type: mongoose.Schema.Types.ObjectId, ref: "Territory" },
    distributor_id: { type: mongoose.Schema.Types.ObjectId, ref: "Distributor" },
    route_name: { type: String, required: true },
    route_code: { type: String, required: true },
    description: String,
    start_point: {
      name: String,
      address: String,
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    end_point: {
      name: String,
      address: String,
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    waypoints: [
      {
        name: String,
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        order: Number,
      },
    ],
    assigned_agent_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "Agent" }],
    assigned_store_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "Store" }],
    distance_km: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { ...baseSchemaOptions, indexes: [{ tenant_id: 1, route_code: 1, unique: true }] }
);

// ==================== EXPORT ALL MODELS ====================
export const Tenant = mongoose.models.Tenant ?? mongoose.model("Tenant", tenantSchema);
export const User = mongoose.models.User ?? mongoose.model("User", userSchema);
export const Role = mongoose.models.Role ?? mongoose.model("Role", roleSchema);
export const Territory = mongoose.models.Territory ?? mongoose.model("Territory", territorySchema);
export const Distributor = mongoose.models.Distributor ?? mongoose.model("Distributor", distributorSchema);
export const Agent = mongoose.models.Agent ?? mongoose.model("Agent", agentSchema);
export const Store = mongoose.models.Store ?? mongoose.model("Store", storeSchema);
export const SalesRoute = mongoose.models.SalesRoute ?? mongoose.model("SalesRoute", salesRouteSchema);
export const Category = mongoose.models.Category ?? mongoose.model("Category", categorySchema);
export const Brand = mongoose.models.Brand ?? mongoose.model("Brand", brandSchema);
export const Product = mongoose.models.Product ?? mongoose.model("Product", productSchema);
export const ProductVariant = mongoose.models.ProductVariant ?? mongoose.model("ProductVariant", productVariantSchema);
export const Warehouse = mongoose.models.Warehouse ?? mongoose.model("Warehouse", warehouseSchema);
export const Batch = mongoose.models.Batch ?? mongoose.model("Batch", batchSchema);
export const Inventory = mongoose.models.Inventory ?? mongoose.model("Inventory", inventorySchema);
export const StockMovement = mongoose.models.StockMovement ?? mongoose.model("StockMovement", stockMovementSchema);
export const PriceList = mongoose.models.PriceList ?? mongoose.model("PriceList", priceListSchema);
export const PriceListItem = mongoose.models.PriceListItem ?? mongoose.model("PriceListItem", priceListItemSchema);
export const PricingRule = mongoose.models.PricingRule ?? mongoose.model("PricingRule", pricingRuleSchema);
export const Order = mongoose.models.Order ?? mongoose.model("Order", orderSchema);
export const CreditNote = mongoose.models.CreditNote ?? mongoose.model("CreditNote", creditNoteSchema);
export const Payment = mongoose.models.Payment ?? mongoose.model("Payment", paymentSchema);
export const Commission = mongoose.models.Commission ?? mongoose.model("Commission", commissionSchema);
export const StoreVisit = mongoose.models.StoreVisit ?? mongoose.model("StoreVisit", storeVisitSchema);
export const Promotion = mongoose.models.Promotion ?? mongoose.model("Promotion", promotionSchema);
export const LoyaltyPoints = mongoose.models.LoyaltyPoints ?? mongoose.model("LoyaltyPoints", loyaltyPointsSchema);
export const Notification = mongoose.models.Notification ?? mongoose.model("Notification", notificationSchema);
export const Analytics = mongoose.models.Analytics ?? mongoose.model("Analytics", analyticsSchema);
export const DeliveryVehicle = mongoose.models.DeliveryVehicle ?? mongoose.model("DeliveryVehicle", deliveryVehicleSchema);
export const DeliveryRoute = mongoose.models.DeliveryRoute ?? mongoose.model("DeliveryRoute", deliveryRouteSchema);
export const Delivery = mongoose.models.Delivery ?? mongoose.model("Delivery", deliverySchema);
export const Integration = mongoose.models.Integration ?? mongoose.model("Integration", integrationSchema);
export const AuditLog = mongoose.models.AuditLog ?? mongoose.model("AuditLog", auditLogSchema);
export const SystemConfig = mongoose.models.SystemConfig ?? mongoose.model("SystemConfig", systemConfigSchema);
export const ApiKey = mongoose.models.ApiKey ?? mongoose.model("ApiKey", apiKeySchema);
