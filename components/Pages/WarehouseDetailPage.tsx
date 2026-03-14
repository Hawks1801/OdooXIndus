/**
 * Warehouse Detail Page
 * Displays detailed information about a single warehouse
 */

"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Warehouse,
  MapPin,
  Tag,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  Package,
  Calendar,
  Clock,
  Building2,
  Boxes,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useWarehouse,
  useDeleteWarehouse,
  useStockByWarehouse,
} from "@/hooks/queries";
import { useBackWithRefresh } from "@/hooks/use-back-with-refresh";
import { useAuth } from "@/contexts";
import Navbar from "@/components/layouts/Navbar";
import { PageContentWrapper } from "@/components/shared";
import { formatDistanceToNow, format } from "date-fns";
import WarehouseDialog from "@/components/warehouses/WarehouseDialog";
import { AlertDialogWrapper } from "@/components/dialogs";
import type { Warehouse as WarehouseType } from "@/types";
import { cn } from "@/lib/utils";

/**
 * Color variants for glassmorphic cards
 */
type CardVariant =
  | "sky"
  | "emerald"
  | "amber"
  | "rose"
  | "violet"
  | "blue"
  | "orange"
  | "teal"
  | "cyan";

const variantConfig: Record<
  CardVariant,
  {
    border: string;
    gradient: string;
    shadow: string;
    hoverBorder: string;
    iconBg: string;
  }
> = {
  sky: {
    border: "",
    gradient: "   ",
    shadow:
      " ",
    hoverBorder: "",
    iconBg: " bg-sky-100/50",
  },
  emerald: {
    border: "",
    gradient:
      "   ",
    shadow:
      " ",
    hoverBorder: "",
    iconBg: " bg-emerald-100/50",
  },
  amber: {
    border: "",
    gradient:
      "   ",
    shadow:
      " ",
    hoverBorder: "",
    iconBg: " bg-amber-100/50",
  },
  rose: {
    border: "",
    gradient:
      "   ",
    shadow:
      " ",
    hoverBorder: "",
    iconBg: " bg-rose-100/50",
  },
  violet: {
    border: "",
    gradient:
      "   ",
    shadow:
      " ",
    hoverBorder: "",
    iconBg: " bg-violet-100/50",
  },
  blue: {
    border: "",
    gradient:
      "   ",
    shadow:
      " ",
    hoverBorder: "",
    iconBg: " bg-blue-100/50",
  },
  orange: {
    border: "",
    gradient:
      "   ",
    shadow:
      " ",
    hoverBorder: "",
    iconBg: " bg-orange-100/50",
  },
  teal: {
    border: "",
    gradient:
      "   ",
    shadow:
      " ",
    hoverBorder: "",
    iconBg: " bg-teal-100/50",
  },
  cyan: {
    border: "",
    gradient:
      "   ",
    shadow:
      " ",
    hoverBorder: "",
    iconBg: " bg-cyan-100/50",
  },
};

/**
 * Glassmorphic Card component
 */
function GlassCard({
  children,
  variant = "teal",
  className,
}: {
  children: React.ReactNode;
  variant?: CardVariant;
  className?: string;
}) {
  const config = variantConfig[variant];
  return (
    <article
      className={cn(
        "group rounded-[20px] border p-4 sm:p-5 backdrop-blur-sm transition-all duration-300",
        "bg-white/60 dark:bg-white/5",
        config.border,
        config.gradient,
        config.shadow,
        config.hoverBorder,
        className,
      )}
    >
      {children}
    </article>
  );
}

/** Badge classes for Warehouse Status (Active/Inactive) — distinct colors for light and dark mode */
function getWarehouseStatusBadgeClasses(active: boolean): string {
  return active
    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 border "
    : "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200 border ";
}

/** Badge classes for Warehouse Type — distinct colors per type, light and dark mode */
function getWarehouseTypeBadgeClasses(type: string): string {
  const t = (type || "").toLowerCase();
  switch (t) {
    case "main":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 border ";
    case "secondary":
      return "bg-slate-100 text-slate-800 dark:bg-slate-700/50 dark:text-slate-200 border border-slate-300/40";
    case "storage":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 border ";
    case "distribution":
      return "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200 border ";
    case "retail":
      return "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200 border ";
    case "other":
      return "bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-200 border border-gray-300/40";
    default:
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 border ";
  }
}

export type WarehouseDetailPageProps = { embedInAdmin?: boolean };

export default function WarehouseDetailPage({
  embedInAdmin,
}: WarehouseDetailPageProps = {}) {
  const params = useParams();
  const router = useRouter();
  const { navigateTo } = useBackWithRefresh("warehouse");
  const warehouseId = params?.id as string;
  const { user, isCheckingAuth } = useAuth();
  const isMountedRef = useRef(false);
  const [isMounted, setIsMounted] = useState(false);

  const PageWrapper = embedInAdmin ? React.Fragment : Navbar;

  const warehousesListHref = embedInAdmin ? "/admin/warehouses" : "/warehouses";

  const {
    data: warehouse,
    isLoading,
    isError,
    error,
  } = useWarehouse(warehouseId);
  const { data: stockAllocations, isLoading: isLoadingStock } =
    useStockByWarehouse(warehouseId);
  const deleteWarehouseMutation = useDeleteWarehouse();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] =
    useState<WarehouseType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isDeleting = deleteWarehouseMutation.isPending;

  const handleEdit = () => {
    if (!warehouse) return;
    setEditingWarehouse(warehouse as WarehouseType);
    setEditDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!warehouse) return;
    deleteWarehouseMutation.mutate(warehouse.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        router.push(warehousesListHref);
      },
      onError: () => {
        setDeleteDialogOpen(false);
      },
    });
  };

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      queueMicrotask(() => setIsMounted(true));
    }
  }, []);

  const showSkeleton = !isMounted || isCheckingAuth || isLoading;

  useEffect(() => {
    if (!isCheckingAuth && !user) {
      router.push("/login");
    }
  }, [user, isCheckingAuth, router]);

  if (isError) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <GlassCard variant="rose" className="max-w-md text-center">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Warehouse Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error instanceof Error
                ? error.message
                : "Failed to load warehouse details"}
            </p>
            <Button
              onClick={() => navigateTo(warehousesListHref)}
              className="rounded-xl border border-gray-300/30 bg-white/50 dark:bg-white/5 dark:border-white/10 hover:bg-gray-100/50 dark:hover:bg-white/10 text-gray-900 dark:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Warehouses
            </Button>
          </GlassCard>
        </div>
      </PageWrapper>
    );
  }

  if (showSkeleton || !warehouse) {
    return (
      <PageWrapper>
        <PageContentWrapper>
          <div className="max-w-9xl mx-auto space-y-6">
            {/* Header Skeleton */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="h-10 w-10 bg-white/50 dark:bg-white/5 rounded-xl border border-gray-300/30 dark:border-white/10 animate-pulse" />
              <div className="flex-1">
                <div className="h-8 w-48 bg-white/50 dark:bg-white/5 rounded-lg border border-gray-300/30 dark:border-white/10 animate-pulse" />
                <div className="h-4 w-32 mt-2 bg-white/50 dark:bg-white/5 rounded-lg border border-gray-300/30 dark:border-white/10 animate-pulse" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-9 w-24 bg-white/50 dark:bg-white/5 rounded-xl border border-gray-300/30 dark:border-white/10 animate-pulse" />
                <div className="h-9 w-24 bg-white/50 dark:bg-white/5 rounded-xl border border-gray-300/30 dark:border-white/10 animate-pulse" />
              </div>
            </div>

            {/* Status Card Skeleton */}
            <GlassCard variant="teal" className="animate-pulse">
              <div className="h-4 w-20 bg-white/50 dark:bg-white/10 rounded mb-3" />
              <div className="h-6 w-24 bg-white/50 dark:bg-white/10 rounded-full" />
            </GlassCard>

            {/* Two Column Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GlassCard variant="cyan" className="animate-pulse">
                <div className="h-6 w-40 bg-white/50 dark:bg-white/10 rounded mb-4" />
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-4 w-full bg-white/50 dark:bg-white/10 rounded"
                    />
                  ))}
                </div>
              </GlassCard>
              <GlassCard variant="violet" className="animate-pulse">
                <div className="h-6 w-36 bg-white/50 dark:bg-white/10 rounded mb-4" />
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-12 w-full bg-white/50 dark:bg-white/10 rounded-lg"
                    />
                  ))}
                </div>
              </GlassCard>
            </div>
          </div>
        </PageContentWrapper>
      </PageWrapper>
    );
  }

  const createdAt =
    typeof warehouse.createdAt === "string"
      ? new Date(warehouse.createdAt)
      : warehouse.createdAt;
  const updatedAt = warehouse.updatedAt
    ? typeof warehouse.updatedAt === "string"
      ? new Date(warehouse.updatedAt)
      : warehouse.updatedAt
    : null;

  // Calculate stock summary
  const stockSummary = stockAllocations
    ? {
        totalProducts: stockAllocations.length,
        totalQuantity: stockAllocations.reduce((sum, a) => sum + a.quantity, 0),
        availableQuantity: stockAllocations.reduce(
          (sum, a) => sum + (a.quantity - a.reservedQuantity),
          0,
        ),
        reservedQuantity: stockAllocations.reduce(
          (sum, a) => sum + a.reservedQuantity,
          0,
        ),
      }
    : null;

  return (
    <PageWrapper>
      <PageContentWrapper>
        <div className="max-w-9xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateTo(warehousesListHref)}
              aria-label="Back to Warehouses"
              className="h-10 w-10 rounded-xl border border-gray-300/30 bg-white/50 dark:bg-white/5 dark:border-white/10 hover:bg-gray-100/50 dark:hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {warehouse.name}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Created {formatDistanceToNow(createdAt, { addSuffix: true })}
              </p>
            </div>
          </div>

          {/* Status Card */}
          <GlassCard variant={warehouse.status ? "emerald" : "rose"}>
            <p className="text-xs uppercase tracking-[0.25em] text-gray-600 dark:text-white/60 mb-3">
              Warehouse Status
            </p>
            <Badge
              variant="outline"
              className={cn(
                "text-sm px-3 py-1.5 rounded-full flex items-center gap-2 w-fit font-medium",
                getWarehouseStatusBadgeClasses(Boolean(warehouse.status)),
              )}
            >
              {warehouse.status ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Active
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  Inactive
                </>
              )}
            </Badge>
          </GlassCard>

          {/* Stock Summary Statistics */}
          {stockSummary && stockSummary.totalProducts > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <GlassCard variant="sky" className="text-center">
                <div
                  className={cn(
                    "p-2.5 rounded-xl border w-fit mx-auto mb-2",
                    variantConfig.sky.iconBg,
                    " dark:bg-sky-500/20",
                  )}
                >
                  <Boxes className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                </div>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stockSummary.totalProducts}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Products
                </p>
              </GlassCard>
              <GlassCard variant="violet" className="text-center">
                <div
                  className={cn(
                    "p-2.5 rounded-xl border w-fit mx-auto mb-2",
                    variantConfig.violet.iconBg,
                    " dark:bg-violet-500/20",
                  )}
                >
                  <Package className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stockSummary.totalQuantity}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Total Stock
                </p>
              </GlassCard>
              <GlassCard variant="emerald" className="text-center">
                <div
                  className={cn(
                    "p-2.5 rounded-xl border w-fit mx-auto mb-2",
                    variantConfig.emerald.iconBg,
                    " dark:bg-emerald-500/20",
                  )}
                >
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
                  {stockSummary.availableQuantity}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Available
                </p>
              </GlassCard>
              <GlassCard variant="amber" className="text-center">
                <div
                  className={cn(
                    "p-2.5 rounded-xl border w-fit mx-auto mb-2",
                    variantConfig.amber.iconBg,
                    " dark:bg-amber-500/20",
                  )}
                >
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400">
                  {stockSummary.reservedQuantity}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Reserved
                </p>
              </GlassCard>
            </div>
          )}

          {/* Warehouse Information & Stock */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard variant="cyan">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={cn(
                    "p-2.5 rounded-xl border",
                    variantConfig.cyan.iconBg,
                    " dark:bg-cyan-500/20",
                  )}
                >
                  <Building2 className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Warehouse Information
                </h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2 text-sm p-3 rounded-xl border">
                  <Warehouse className="h-4 w-4 text-cyan-500 dark:text-cyan-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <span className="text-gray-600 dark:text-gray-400">
                      Name:
                    </span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {warehouse.name}
                    </span>
                  </div>
                </div>

                {warehouse.address && (
                  <div className="flex items-start gap-2 text-sm p-3 rounded-xl border">
                    <MapPin className="h-4 w-4 text-teal-500 dark:text-teal-400 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <span className="text-gray-600 dark:text-gray-400">
                        Address:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white block mt-1">
                        {warehouse.address}
                      </span>
                    </div>
                  </div>
                )}

                {warehouse.type && (
                  <div className="flex items-center gap-2 text-sm p-3 rounded-xl border">
                    <Tag className="h-4 w-4 text-blue-500 dark:text-blue-400 shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Type:
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "capitalize font-medium text-sm px-3 py-1 rounded-full",
                        getWarehouseTypeBadgeClasses(warehouse.type),
                      )}
                    >
                      {warehouse.type}
                    </Badge>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm p-3 rounded-xl border">
                  <Calendar className="h-4 w-4 text-orange-500 dark:text-orange-400 shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Created:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {format(createdAt, "MMM d, yyyy 'at' h:mm a")}
                  </span>
                </div>

                {updatedAt && (
                  <div className="flex items-center gap-2 text-sm p-3 rounded-xl border">
                    <Clock className="h-4 w-4 text-violet-500 dark:text-violet-400 shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Updated:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatDistanceToNow(updatedAt, { addSuffix: true })}
                    </span>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Stock by warehouse */}
            <GlassCard variant="violet">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={cn(
                    "p-2.5 rounded-xl border",
                    variantConfig.violet.iconBg,
                    " dark:bg-violet-500/20",
                  )}
                >
                  <Package className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Stock in Warehouse
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Products allocated to this warehouse
                  </p>
                </div>
              </div>

              <div className="mt-4">
                {isLoadingStock ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-12 bg-white/50 dark:bg-white/10 animate-pulse rounded-xl"
                      />
                    ))}
                  </div>
                ) : stockAllocations && stockAllocations.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {stockAllocations.map((allocation, index) => {
                      const colors = [
                        "sky",
                        "emerald",
                        "amber",
                        "blue",
                        "teal",
                      ] as const;
                      const colorVariant = colors[index % colors.length];
                      return (
                        <div
                          key={allocation.id}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-xl border transition-all duration-200 hover:scale-[1.02]",
                            ` from-${colorVariant}-100/50 via-${colorVariant}-50/30  dark:from-${colorVariant}-500/10 dark:via-${colorVariant}-500/5 `,
                            `border-${colorVariant}-200/30 dark:border-${colorVariant}-400/10`,
                          )}
                          style={{
                            background: `linear-gradient(to right, rgb(var(--${colorVariant === "sky" ? "14 165 233" : colorVariant === "emerald" ? "16 185 129" : colorVariant === "amber" ? "245 158 11" : colorVariant === "blue" ? "59 130 246" : "20 184 166"}) / 0.1), transparent)`,
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate text-gray-900 dark:text-white">
                              {allocation.product?.name || "Unknown Product"}
                            </p>
                            {allocation.product?.sku && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                SKU: {allocation.product.sku}
                              </p>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <p className="font-semibold text-sm text-emerald-600 dark:text-emerald-400">
                              {allocation.quantity -
                                allocation.reservedQuantity}{" "}
                              <span className="text-gray-500 dark:text-gray-400 font-normal">
                                avail
                              </span>
                            </p>
                            {allocation.reservedQuantity > 0 && (
                              <p className="text-xs text-amber-600 dark:text-amber-400">
                                {allocation.reservedQuantity} reserved
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 rounded-xl bg-white/30 dark:bg-white/5 border">
                    <div
                      className={cn(
                        "p-3 rounded-xl border w-fit mx-auto mb-3",
                        variantConfig.violet.iconBg,
                        " dark:bg-violet-500/20",
                      )}
                    >
                      <Package className="h-8 w-8 text-violet-500/50 dark:text-violet-400/50" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      No stock allocated to this warehouse yet
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Use the stock allocation feature to assign products
                    </p>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
            <Button
              variant="outline"
              onClick={() => navigateTo(warehousesListHref)}
              className="w-full sm:w-auto gap-2 rounded-xl border border-gray-300/30 bg-white/50 dark:bg-white/5 dark:border-white/10 hover:bg-gray-100/50 dark:hover:bg-white/10 text-gray-900 dark:text-white transition-all duration-300"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              Back
            </Button>
            <Button
              onClick={handleEdit}
              className="w-full sm:w-auto gap-2 rounded-xl border text-white  backdrop-blur-sm transition-all duration-300"
            >
              <Edit className="h-4 w-4 shrink-0" />
              Edit Warehouse
            </Button>
            <Button
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isDeleting}
              className="w-full sm:w-auto gap-2 rounded-xl border text-white  backdrop-blur-sm transition-all duration-300 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              {isDeleting ? "Deleting..." : "Delete Warehouse"}
            </Button>
          </div>
        </div>

        <WarehouseDialog
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) setEditingWarehouse(null);
          }}
          editingWarehouse={editingWarehouse}
          onEditWarehouse={(w) => setEditingWarehouse(w)}
        >
          <div style={{ display: "none" }} />
        </WarehouseDialog>

        <AlertDialogWrapper
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Are you absolutely sure?"
          description={`This will permanently delete the warehouse "${warehouse.name}".`}
          actionLabel="Delete"
          actionLoadingLabel="Deleting..."
          isLoading={isDeleting}
          onAction={handleConfirmDelete}
          onCancel={() => setDeleteDialogOpen(false)}
          actionVariant="destructive"
        />
      </PageContentWrapper>
    </PageWrapper>
  );
}
