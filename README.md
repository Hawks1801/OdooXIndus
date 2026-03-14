# CoreInventory IMS 📦

**CoreInventory** is a modular, real-time Inventory Management System (IMS) designed to digitize and streamline stock-related operations. Developed for the Odoo-inspired hackathon challenge, this application replaces manual registers and scattered spreadsheets with a centralized, easy-to-use digital platform.

## 🚀 Key Features

### 📊 Dashboard & KPIs
- **Real-time Insights:** A centralized dashboard providing a snapshot of inventory health.
- **Dynamic KPIs:**
  - Total Products in Stock.
  - Low Stock & Out of Stock alerts.
  - **Pending Receipts:** Track incoming goods from suppliers.
  - **Pending Deliveries:** Manage outgoing shipments to customers.
  - **Internal Transfers:** Monitor scheduled stock movements within the company.

### 📦 Product Management
- **Detailed Tracking:** Manage products with Name, SKU, Category, and Unit of Measure (kg, pcs, box, etc.).
- **Initial Stocking:** Set opening stock levels during product creation.
- **Availability per Location:** Track exactly how much stock is in which warehouse.

### ⚙️ Core Operations
- **Receipts (Goods In):** Form-based entry for incoming stock with a **Validation Workflow**. Stock levels increase automatically only upon validation.
- **Delivery Orders (Goods Out):** Pick, pack, and validate outgoing shipments. Validation auto-decreases stock levels.
- **Internal Transfers:** Move stock between locations (e.g., *Main Warehouse → Production Floor*) with a logged ledger of every movement.
- **Stock Adjustments:** Reconcile physical counts with recorded stock through manual adjustment logs.

### 🔐 Security & Tech Stack
- **Next.js 15 & React 19:** Built with the latest App Router for extreme performance.
- **SQLite (Relational DB):** Uses a robust relational schema to ensure data integrity and foreign key constraints.
- **Prisma ORM:** Type-safe database queries.
- **Authentication:** Custom JWT-based auth with Role-Based Access Control (Admin/Staff) and Google OAuth support.
- **Tailwind CSS & shadcn/ui:** Professional, modern, and responsive user interface.

## 🛠️ Tech Stack
- **Frontend:** Next.js (TypeScript), Tailwind CSS, Lucide Icons.
- **Backend:** Next.js API Routes (Serverless).
- **Database:** SQLite (local `dev.db` for easy portability and demo).
- **ORM:** Prisma.

## 🏁 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Database Setup
```bash
# Initialize the SQLite database and run migrations
npx prisma migrate dev --name init

# Seed the database with demo admin and sample data
node prisma/seed.js
```

### 3. Run the App
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see the result.

### 4. Demo Credentials
- **Email:** `admin@coreinventory.com`
- **Password:** `admin123`

## 📂 Project Structure
- `app/admin/operations`: Contains the custom logic for Receipts, Deliveries, and Transfers.
- `prisma/schema.prisma`: The relational data model for the entire system.
- `lib/server/dashboard-data.ts`: Backend logic for calculating inventory KPIs.

---
Built for the **Odoo X Indus** Hackathon.
