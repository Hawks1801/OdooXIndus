const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  // 1. Create a Demo Admin User
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@coreinventory.com" },
    update: {},
    create: {
      email: "admin@coreinventory.com",
      name: "Demo Admin",
      password: hashedPassword,
      role: "admin",
    },
  });

  console.log("✅ Demo user created: admin@coreinventory.com / admin123");

  // 2. Create Warehouses
  const wh1 = await prisma.warehouse.create({
    data: {
      name: "Main Warehouse",
      address: "123 Inventory St, Silicon Valley",
      type: "main",
      userId: admin.id,
    },
  });

  const wh2 = await prisma.warehouse.create({
    data: {
      name: "Production Floor",
      address: "Section B, Factory Zone",
      type: "secondary",
      userId: admin.id,
    },
  });

  console.log("✅ Warehouses created");

  // 3. Create Categories
  const cat1 = await prisma.category.create({
    data: { name: "Electronics", userId: admin.id },
  });
  const cat2 = await prisma.category.create({
    data: { name: "Raw Materials", userId: admin.id },
  });

  // 4. Create Supplier
  const supplier = await prisma.supplier.create({
    data: { name: "Global Tech Supplies", userId: admin.id },
  });

  // 5. Create Products
  await prisma.product.create({
    data: {
      name: "Steel Rods",
      sku: "STEL-001",
      price: 50.0,
      quantity: 100,
      unitOfMeasure: "kg",
      status: "Available",
      categoryId: cat2.id,
      supplierId: supplier.id,
      userId: admin.id,
    },
  });

  await prisma.product.create({
    data: {
      name: "Logic Boards",
      sku: "ELEC-99",
      price: 120.5,
      quantity: 15,
      unitOfMeasure: "pcs",
      status: "Stock Low",
      categoryId: cat1.id,
      supplierId: supplier.id,
      userId: admin.id,
    },
  });

  console.log("✅ Products seeded");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
