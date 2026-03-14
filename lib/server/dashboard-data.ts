import { getCache, setCache, cacheKeys } from "@/lib/cache";
import { prisma } from "@/prisma/client";
import type {
  DashboardStats,
  DashboardCounts,
  DashboardRevenue,
  DashboardTrendPoint,
  DashboardRecent,
  DashboardRecentOrder,
  DashboardRecentTicket,
  DashboardRecentReview,
  DashboardRecentImport,
  DashboardProductStatusBreakdown,
  DashboardUserRoleBreakdown,
  DashboardSupplierStatusBreakdown,
  DashboardCategoryStatusBreakdown,
  DashboardTicketStatusBreakdown,
  DashboardReviewStatusBreakdown,
} from "@/types";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getLast12Months() {
  const now = new Date();
  const out = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const key = `${y}-${String(m).padStart(2, "0")}`;
    const label = `${MONTH_LABELS[m - 1]} ${String(y).slice(2)}`;
    out.push({ year: y, month: m, key, label });
  }
  return out;
}

export async function getDashboardForAdmin(userId: string): Promise<DashboardStats> {
  const cacheKey = cacheKeys.dashboard.overview(userId);
  const cached = await getCache<DashboardStats>(cacheKey);
  if (cached) return cached;

  // Basic counts using Prisma
  const [
    products,
    suppliers,
    categories,
    orders,
    warehouses,
    pendingReceipts,
    pendingDeliveries,
    scheduledTransfers,
    users,
  ] = await Promise.all([
    prisma.product.findMany({ where: { userId } }),
    prisma.supplier.findMany({ where: { userId } }),
    prisma.category.findMany({ where: { userId } }),
    prisma.order.findMany({ where: { userId } }),
    prisma.warehouse.findMany({ where: { userId } }),
    prisma.receipt.count({ where: { userId, status: { in: ["draft", "waiting", "ready"] } } }),
    prisma.order.count({ where: { userId, status: "pending" } }),
    prisma.stockTransfer.count({ where: { userId, status: "pending" } }),
    prisma.user.findMany(),
  ]);

  const counts: DashboardCounts = {
    products: products.length,
    users: users.length,
    suppliers: suppliers.length,
    categories: categories.length,
    orders: orders.length,
    invoices: 0,
    warehouses: warehouses.length,
    tickets: 0,
    reviews: 0,
    pendingReceipts,
    pendingDeliveries,
    scheduledTransfers,
  };

  // Product status breakdown
  const productStatusBreakdown: DashboardProductStatusBreakdown = {
    available: products.filter(p => p.status === "Available").length,
    stockLow: products.filter(p => p.status === "Stock Low").length,
    stockOut: products.filter(p => p.status === "Stock Out").length,
  };

  const userRoleBreakdown: DashboardUserRoleBreakdown = {
    admin: users.filter(u => u.role === "admin").length,
    client: users.filter(u => u.role === "client").length,
    supplier: users.filter(u => u.role === "supplier").length,
  };

  const trends: DashboardTrendPoint[] = getLast12Months().map(m => ({
    month: m.key,
    label: m.label,
    orders: 0,
    revenue: 0,
    products: 0,
    invoices: 0,
  }));

  const result: any = {
    counts,
    productStatusBreakdown,
    userRoleBreakdown,
    trends,
    revenue: { fromOrders: 0, fromInvoices: 0 },
    recent: { orders: [], tickets: [], reviews: [], imports: [] },
    orderAnalytics: { statusDistribution: { pending: 0, confirmed: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 }, topProducts: [] },
    invoiceAnalytics: { statusDistribution: { draft: 0, sent: 0, paid: 0, overdue: 0, cancelled: 0 }, totalRevenue: 0 },
    warehouseAnalytics: { totalWarehouses: warehouses.length, activeWarehouses: warehouses.length, inactiveWarehouses: 0, typeDistribution: [] },
  };

  await setCache(cacheKey, result, 300);
  return result;
}
