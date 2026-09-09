# RoutePro Mobile & Client App API Specification Document
**Version:** 2.0  
**Base URL:** `https://your-domain.com` (or `http://localhost:3000`)  
**Content-Type:** `application/json`  
**Authentication:** Cookie-based Session (`routepro_session`) or Bearer Token Header  

---

## Table of Contents
1. [Authentication & Account Onboarding](#1-authentication--account-onboarding)
2. [Client / Shopkeeper App APIs](#2-client--shopkeeper-app-apis)
3. [Field Agent Mobile App APIs](#3-field-agent-mobile-app-apis)
4. [Product Catalog & Inventory APIs](#4-product-catalog--inventory-apis)
5. [Sales Orders & Fulfillment APIs](#5-sales-orders--fulfillment-apis)
6. [Field Visits & Location Tracking APIs](#6-field-visits--location-tracking-apis)
7. [Field SOP Policies & Incentives APIs](#7-field-sop-policies--incentives-apis)
8. [Territories & Sales Routes APIs](#8-territories--sales-routes-apis)
9. [Bulk Data Entry APIs](#9-bulk-data-entry-apis)
10. [RBAC Roles & Governance APIs](#10-rbac-roles--governance-apis)

---

## 1. Authentication & Account Onboarding

### 1.1 Store Owner Self-Registration
Allows new shopkeepers to register their retail store and create an app account.

- **Endpoint:** `POST /api/auth/register-store`
- **Request Body:**
```json
{
  "store_name": "Al-Madina Super Mart",
  "store_type": "kirana",
  "owner_info": {
    "name": "Muhammad Aslam",
    "phone": "+923001234567",
    "email": "aslam.store@gmail.com"
  },
  "address": {
    "line1": "Shop 14, Commercial Market",
    "city": "Islamabad",
    "state": "Punjab",
    "pincode": "44000",
    "country": "Pakistan",
    "latitude": 33.7182,
    "longitude": 73.0714
  },
  "password": "SecurePassword123"
}
```
- **Response (200 OK):**
```json
{
  "user": {
    "id": "65e...",
    "email": "aslam.store@gmail.com",
    "user_type": "store",
    "store_id": "65e...",
    "company_name": "RoutePro Dist"
  }
}
```

---

### 1.2 User Login (All Account Types)
Authenticates Admins, Managers, Field Agents, or Shopkeepers.

- **Endpoint:** `POST /api/auth/login`
- **Request Body:**
```json
{
  "email": "aslam.store@gmail.com",
  "password": "SecurePassword123"
}
```
- **Response (200 OK):** Sets HTTP-only `routepro_session` cookie. Returns user session object.

---

### 1.3 Get Current Active User Profile (`/me`)
Fetches profile, linked store/agent entity IDs, role code, and module permission matrix.

- **Endpoint:** `GET /api/auth/me`
- **Response (200 OK):**
```json
{
  "user": {
    "id": "65e...",
    "email": "aslam.store@gmail.com",
    "first_name": "Muhammad",
    "last_name": "Aslam",
    "company_name": "RoutePro Dist",
    "user_type": "store",
    "store_id": "65e...",
    "agent_id": null,
    "role_code": "store",
    "role_name": "Store Owner",
    "permissions": null
  }
}
```

---

### 1.4 Logout
Terminates active session.

- **Endpoint:** `POST /api/auth/logout`

---

## 2. Client / Shopkeeper App APIs

### 2.1 Store Client Overview Dashboard
Returns real-time metrics for the logged-in shopkeeper (credit limit, used credit, available credit, active orders count).

- **Endpoint:** `GET /api/store/dashboard`
- **Response (200 OK):**
```json
{
  "store": {
    "store_name": "Al-Madina Super Mart",
    "store_code": "ST92811",
    "owner_name": "Muhammad Aslam",
    "owner_phone": "+923001234567"
  },
  "credit_info": {
    "credit_limit": 50000,
    "used_credit": 12500,
    "available_credit": 37500,
    "payment_terms": "credit_15"
  },
  "orders_count": 8,
  "recent_orders": [...]
}
```

---

## 3. Field Agent Mobile App APIs

### 3.1 Assigned Sales Routes
Fetches daily sales routes assigned to the field agent, including start/end points, waypoints, and distance.

- **Endpoint:** `GET /api/agent/assigned-routes`
- **Response (200 OK):**
```json
{
  "data": [
    {
      "_id": "65e...",
      "route_name": "Blue Area Route 01",
      "route_code": "R-BA-01",
      "territory_name": "Central Islamabad",
      "distance_km": 14.5,
      "start_point": { "name": "Zero Point Hub", "latitude": 33.69, "longitude": 73.05 },
      "end_point": { "name": "Blue Area Commercial", "latitude": 33.7182, "longitude": 73.0714 }
    }
  ]
}
```

---

### 3.2 Assigned Market Outlets & Shops
Fetches all retail stores assigned to the agent or along their route with complete owner info (`owner_name`, `owner_phone`), address, and GPS coordinates.

- **Endpoint:** `GET /api/agent/assigned-stores`
- **Response (200 OK):**
```json
{
  "data": [
    {
      "_id": "65e...",
      "store_code": "ST92811",
      "store_name": "Al-Madina Super Mart",
      "store_type": "kirana",
      "owner_name": "Muhammad Aslam",
      "owner_phone": "+923001234567",
      "owner_info": {
        "name": "Muhammad Aslam",
        "phone": "+923001234567"
      },
      "address": {
        "line1": "Shop 14 Commercial",
        "city": "Islamabad",
        "state": "Punjab",
        "latitude": 33.7182,
        "longitude": 73.0714
      }
    }
  ]
}
```

---

### 3.3 Onboard New Store Context Setup
Provides suggested store codes, assigned route list, and territory defaults when an agent onboards a new shop in the field.

- **Endpoint:** `GET /api/agent/store-context`
- **Response (200 OK):**
```json
{
  "data": {
    "agent": { "_id": "65e...", "agent_code": "AGT-01" },
    "suggested_store_code": "STR-94812",
    "routes": [...],
    "territories": [...],
    "distributors": [...]
  }
}
```

---

### 3.4 Create / Onboard Store in Field
Allows an agent to onboard a new store directly from the mobile app.

- **Endpoint:** `POST /api/stores`
- **Request Body:**
```json
{
  "store_code": "STR-94812",
  "store_name": "New City Mart",
  "store_type": "supermarket",
  "distributor_id": "65e...",
  "territory_id": "65e...",
  "assigned_agent_id": "65e...",
  "assigned_route_id": "65e...",
  "owner_info": {
    "name": "Tariq Khan",
    "phone": "+923009876543",
    "email": "tariq@gmail.com"
  },
  "address": {
    "line1": "Main G-9 Markaz",
    "city": "Islamabad",
    "state": "Punjab",
    "pincode": "44000",
    "latitude": 33.692,
    "longitude": 73.031
  }
}
```

---

## 4. Product Catalog & Inventory APIs

### 4.1 Browse Product Catalog & SKUs
Lists all products with master pricing (MRP, wholesale, retail), current stock, unit of measure, and image URLs.

- **Endpoint:** `GET /api/products`
- **Query Parameters:** `category_id`, `brand_id`, `search`, `page`, `limit`
- **Response (200 OK):**
```json
{
  "data": [
    {
      "_id": "65e...",
      "product_name": "Premium Tea 500g Pack",
      "product_code": "SKU-TEA-500",
      "sku": "TEA-500G",
      "unit_of_measure": "box",
      "pricing": {
        "mrp": 750,
        "wholesale_price": 680,
        "retail_price": 720
      },
      "inventory": {
        "current_stock": 450,
        "minimum_stock": 50
      }
    }
  ]
}
```

---

## 5. Sales Orders & Fulfillment APIs

### 5.1 Create / Book Sales Order
Books a purchase order (used by both Shopkeepers directly and Field Agents on behalf of shopkeepers).

- **Endpoint:** `POST /api/orders`
- **Request Body:**
```json
{
  "store_id": "65e...",
  "agent_id": "65e...",
  "items": [
    {
      "product_id": "65e...",
      "product_name": "Premium Tea 500g Pack",
      "quantity": 10,
      "unit_price": 680
    }
  ],
  "payment_method": "credit",
  "notes": "Deliver before noon"
}
```
- **Response (200 OK):**
```json
{
  "data": {
    "_id": "65e...",
    "order_number": "ORD-2026-0042",
    "grand_total": 6800,
    "status": "pending",
    "delivery_status": "unassigned"
  }
}
```

---

### 5.2 List Orders
- **Endpoint:** `GET /api/orders`
- **Query Parameters:** `store_id`, `agent_id`, `status`

---

## 6. Field Visits, Geofence & Location Telematics APIs

### 6.1 Log Field Visit Check-In (100m Geofence Validated)
Records a field agent check-in to a shopkeeper outlet, automatically calculates distance in meters against store GPS, and verifies 100m geofence compliance.

- **Endpoint:** `POST /api/store-visits/check-in`
- **Request Body:**
```json
{
  "store_id": "65e...",
  "latitude": 33.7182,
  "longitude": 73.0714,
  "notes": "ORDER BOOKED: Discussed SKU promotion"
}
```
- **Response (200 OK):**
```json
{
  "data": {
    "visit_id": "65e...",
    "status": "completed",
    "distance_meters": 18,
    "verified_by_geofence": true,
    "is_flagged": false
  }
}
```
*Note: If `distance_meters` > 100m, `verified_by_geofence` returns `false` and `is_flagged` returns `true` with `flag_reason`: `"Outside 100m Geofence (320m away)"`.*

---

### 6.2 Get Live Fleet Telematics & Heatmap Radar Data
Returns live agent positions, recent store visit logs with distance calculations, geofence compliance stats, and route clusters.

- **Endpoint:** `GET /api/telematics`
- **Response (200 OK):**
```json
{
  "data": {
    "metrics": {
      "total_visits_today": 42,
      "verified_visits": 39,
      "flagged_visits": 3,
      "geofence_pass_rate_pct": 93,
      "active_agents_count": 12,
      "assigned_routes_count": 8
    },
    "agents": [...],
    "stores": [...],
    "visits": [...]
  }
}
```

---

## 7. Field SOP Policies & Incentives APIs

### 7.1 List Active SOP Policies & Rates
- **Endpoint:** `GET /api/policies`
- **Response:** Lists policies with Agent Commission %, Store Rebate %, target thresholds, and price range tiers.

---

## 8. Territories & Sales Routes APIs
- **GET /api/territories**: List all territory zones.
- **GET /api/routes**: List sales routes.

---

## 9. Bulk Data Entry APIs
- **GET /api/bulk-import/template?entity=agents|products|stores|territories|routes**: Generates `.xlsx` template.
- **POST /api/bulk-import**: Accepts parsed rows and batch inserts records.

---

## 10. RBAC Roles & Governance APIs
- **GET /api/roles**: List roles & module rights.
- **POST /api/roles**: Create custom manager role.
- **GET /api/users**: List team managers.
- **POST /api/users**: Create manager account with assigned role.

---

## 11. HR, Shift Attendance & Automated Payroll APIs

### 11.1 Agent Shift Clock-In / Clock-Out
Allows field agents to mark daily shift attendance with GPS location coordinates. Automatically evaluates shift start time (e.g. 10:00 AM), 15m grace period, and evening shift compensation.

- **Endpoint:** `POST /api/hr/attendance/clock-in`
- **Request Body:**
```json
{
  "agent_id": "65e...",
  "action": "clock_in",
  "latitude": 33.7182,
  "longitude": 73.0714,
  "address": "Blue Area Commercial, Islamabad"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Successfully Clocked In at 10:04 AM",
  "data": {
    "_id": "65e...",
    "agent_id": "65e...",
    "date": "2026-09-09",
    "clock_in": "2026-09-09T05:04:00.000Z",
    "status": "present",
    "late_minutes": 0
  }
}
```

- **Clock-Out Request:**
```json
{
  "agent_id": "65e...",
  "action": "clock_out",
  "latitude": 33.7182,
  "longitude": 73.0714,
  "address": "Blue Area Commercial, Islamabad"
}
```
- **Response (200 OK):** Calculates total hours worked, effective work hours, overtime minutes, and checks evening compensation status.

---

### 11.2 Get Agent Daily Attendance Record
- **Endpoint:** `GET /api/hr/attendance/clock-in?agent_id=65e...&date=2026-09-09`
- **Response (200 OK):** Returns active shift record with clock-in/out timestamps and status.

---

### 11.3 Query Attendance Records (Admin / HR)
- **Endpoint:** `GET /api/hr/attendance`
- **Query Parameters:** `date=YYYY-MM-DD`, `month=YYYY-MM`, `agent_id=65e...`

---

### 11.4 Manage Shift Policies
- **GET /api/hr/policies**: Lists active attendance and shift policies.
- **POST /api/hr/policies**: Creates new shift policy (shift start/end times, grace period, overtime multiplier, late penalty rate).

---

### 11.5 Monthly Payroll Generator & Status Updates
- **GET /api/hr/payroll?month=2026-09**: Lists monthly payroll records with sales commissions, overtime, and itemized pay slips.
- **POST /api/hr/payroll**: Automatically calculates monthly salary, days present/absent, late deductions, overtime pay, and sales commissions.
---

### 11.6 Agent Teams & Group Policy Inheritance
- **GET /api/hr/teams**: Lists all field agent teams, member agents, and assigned team shift policies.
- **POST /api/hr/teams**: Creates a new Agent Team (`team_name`, `team_code`, `assigned_policy_id`, `assigned_agent_ids`). All member agents automatically inherit the team's shift policy.

---
*Documentation Generated for RoutePro v2.0 Client & Mobile Integration.*


