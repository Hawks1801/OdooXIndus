"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  History,
  ShoppingCart,
  Truck,
  Settings,
  ClipboardList,
  ArrowRightLeft,
  Settings2,
  ListTree,
  AlertTriangle,
  LogIn,
  LogOut,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts";

/**
 * Admin sidebar restructured for CoreInventory.
 */

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const DASHBOARD_ITEM: NavItem = {
  href: "/admin/dashboard-overall-insights",
  label: "Dashboard",
  icon: LayoutDashboard,
};

const PRODUCT_ITEMS: NavItem[] = [
  {
    href: "/admin/products",
    label: "Products",
    icon: Package,
  },
  {
    href: "/admin/stock-availability",
    label: "Stock Availability",
    icon: Warehouse,
  },
];

const OPERATION_ITEMS: NavItem[] = [
  {
    href: "/admin/operations/receipts",
    label: "Receipts",
    icon: LogIn,
  },
  {
    href: "/admin/operations/deliveries",
    label: "Delivery Orders",
    icon: Truck,
  },
  {
    href: "/admin/operations/adjustments",
    label: "Inventory Adjustment",
    icon: Settings2,
  },
];

const HISTORY_ITEM: NavItem = {
  href: "/admin/activity-history",
  label: "Move History",
  icon: History,
};

const SETTING_ITEMS: NavItem[] = [
  {
    href: "/admin/warehouses",
    label: "Warehouse",
    icon: Warehouse,
  },
];

export default function AdminSidebar({ collapsed = false }: { collapsed?: boolean } = {}) {
  const pathname = usePathname();

  const linkClass = (href: string, isSub = false) =>
    cn(
      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      isSub && !collapsed ? "pl-8" : "",
      collapsed ? "justify-center px-0 w-9 h-9 mx-auto" : "",
      pathname === href || (href !== "/admin" && pathname.startsWith(href))
        ? "bg-sky-500/15 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300"
        : "hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300",
    );

  const renderNavItems = (items: NavItem[], isSub = false) =>
    items.map((item) => {
      const Icon = item.icon;
      return (
        <Link
          key={item.href}
          href={item.href}
          className={linkClass(item.href, isSub)}
          title={collapsed ? item.label : undefined}
        >
          <Icon className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
        </Link>
      );
    });

  if (collapsed) {
    return (
      <nav className="flex min-h-0 flex-col items-center py-3 gap-1" aria-label="Admin navigation">
        <Link href={DASHBOARD_ITEM.href} className={linkClass(DASHBOARD_ITEM.href)} title={DASHBOARD_ITEM.label}>
          <DASHBOARD_ITEM.icon className="h-4 w-4 flex-shrink-0" />
        </Link>
        <div className="w-6 border-t border-gray-200/50 dark:border-white/10 my-1" />
        {renderNavItems(PRODUCT_ITEMS)}
        <div className="w-6 border-t border-gray-200/50 dark:border-white/10 my-1" />
        {renderNavItems(OPERATION_ITEMS)}
        <div className="w-6 border-t border-gray-200/50 dark:border-white/10 my-1" />
        <Link href={HISTORY_ITEM.href} className={linkClass(HISTORY_ITEM.href)} title={HISTORY_ITEM.label}>
          <HISTORY_ITEM.icon className="h-4 w-4 flex-shrink-0" />
        </Link>
        <div className="w-6 border-t border-gray-200/50 dark:border-white/10 my-1" />
        {renderNavItems(SETTING_ITEMS)}
      </nav>
    );
  }

  return (
    <nav className="flex min-h-0 flex-col p-2 gap-1 overflow-y-auto">
      {/* Dashboard */}
      <Link href={DASHBOARD_ITEM.href} className={linkClass(DASHBOARD_ITEM.href)}>
        <DASHBOARD_ITEM.icon className="h-4 w-4 flex-shrink-0" />
        <span className="min-w-0 flex-1 truncate">{DASHBOARD_ITEM.label}</span>
      </Link>

      {/* Products */}
      <p className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Products
      </p>
      {renderNavItems(PRODUCT_ITEMS)}

      {/* Operations */}
      <p className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Operations
      </p>
      {renderNavItems(OPERATION_ITEMS)}

      {/* Move History */}
      <p className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        History
      </p>
      <Link href={HISTORY_ITEM.href} className={linkClass(HISTORY_ITEM.href)}>
        <HISTORY_ITEM.icon className="h-4 w-4 flex-shrink-0" />
        <span className="min-w-0 flex-1 truncate">{HISTORY_ITEM.label}</span>
      </Link>

      {/* Settings */}
      <p className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Settings
      </p>
      {renderNavItems(SETTING_ITEMS)}
    </nav>
  );
}

