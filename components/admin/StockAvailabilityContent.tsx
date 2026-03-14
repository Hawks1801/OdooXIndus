"use client";

import React, { useLayoutEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import ProductList from "@/components/products/ProductList";
import { PageContentWrapper } from "@/components/shared";
import { useProducts } from "@/hooks/queries";
import { queryKeys } from "@/lib/react-query";
import type { ProductForHome } from "@/lib/server/home-data";

export type StockAvailabilityContentProps = {
  initialProducts?: ProductForHome[];
};

/**
 * Stock Availability section — Focused on product stock levels.
 */
export default function StockAvailabilityContent({
  initialProducts,
}: StockAvailabilityContentProps = {}) {
  const queryClient = useQueryClient();
  const { data: allProducts = [] } = useProducts();

  useLayoutEffect(() => {
    if (initialProducts != null) {
      queryClient.setQueryData(queryKeys.products.lists(), initialProducts);
    }
  }, [queryClient, initialProducts]);

  return (
    <PageContentWrapper>
      <div className="flex flex-col gap-4">
        <ProductList />
      </div>
    </PageContentWrapper>
  );
}
