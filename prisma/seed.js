const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("12345678", 10);

  // 1. Create Users for each role
  const admin = await prisma.user.upsert({
    where: { email: "test@admin.com" },
    update: { password },
    create: { email: "test@admin.com", name: "System Admin", password, role: "admin" },
  });

  const supplierUser = await prisma.user.upsert({
    where: { email: "test@supplier.com" },
    update: { password },
    create: { email: "test@supplier.com", name: "Global Tech Supplier", password, role: "supplier" },
  });

  const clientUser = await prisma.user.upsert({
    where: { email: "test@client.com" },
    update: { password },
    create: { email: "test@client.com", name: "Major Retailer Corp", password, role: "client" },
  });

  console.log("✅ Users created: test@admin.com, test@supplier.com, test@client.com (Pass: 12345678)");

  // 2. Create Supplier Profile
  const supplier = await prisma.supplier.upsert({
    where: { id: "seed-supplier-1" },
    update: {},
    create: {
      id: "seed-supplier-1",
      name: "Global Tech Supplies",
      contactName: "John Supplier",
      email: "contact@globaltech.com",
      phone: "+1234567890",
      address: "Industrial Zone, Tech City",
      userId: supplierUser.id,
    },
  });

  // 3. Create Categories
  const cat1 = await prisma.category.create({ data: { name: "Electronics", userId: admin.id } });
  const cat2 = await prisma.category.create({ data: { name: "Industrial", userId: admin.id } });

  // 4. Create Warehouses
  const wh1 = await prisma.warehouse.create({
    data: { name: "Main Distribution Center", address: "123 Hub St", type: "main", userId: admin.id },
  });

  // 5. Create Products
  const p1 = await prisma.product.create({
    data: {
      name: "Premium Logic Board",
      sku: "PCB-001",
      price: 250.0,
      quantity: 50,
      unitOfMeasure: "pcs",
      status: "Available",
      categoryId: cat1.id,
      supplierId: supplier.id,
      userId: admin.id,
    },
  });

  const p2 = await prisma.product.create({
    data: {
      name: "Heavy Duty Steel Beam",
      sku: "STL-99",
      price: 1500.0,
      quantity: 10,
      unitOfMeasure: "unit",
      status: "Stock Low",
      categoryId: cat2.id,
      supplierId: supplier.id,
      userId: admin.id,
    },
  });

  console.log("✅ Inventory seeded");

  // 6. Create an Order for the Client
  const order = await prisma.order.create({
    data: {
      orderNumber: "ORD-DEMO-001",
      userId: admin.id,
      clientId: clientUser.id,
      status: "confirmed",
      paymentStatus: "paid",
      subtotal: 500.0,
      total: 535.0,
      tax: 35.0,
      items: {
        create: [
          {
            productId: p1.id,
            productName: p1.name,
            sku: p1.sku,
            quantity: 2,
            price: 250.0,
            subtotal: 500.0,
          }
        ]
      }
    }
  });

  // 7. Create an Invoice
  await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-DEMO-001",
      orderId: order.id,
      userId: admin.id,
      clientId: clientUser.id,
      status: "paid",
      subtotal: 500.0,
      total: 535.0,
      tax: 35.0,
      amountPaid: 535.0,
      amountDue: 0,
      dueDate: new Date(),
      issuedAt: new Date(),
    }
  });

  // 8. Create a Notification
  await prisma.notification.create({
    data: {
      userId: admin.id,
      type: "low_stock",
      title: "Stock Alert",
      message: "Heavy Duty Steel Beam is running low (10 left)",
      read: false,
    }
  });

  console.log("✅ Orders, Invoices, and Notifications seeded");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
