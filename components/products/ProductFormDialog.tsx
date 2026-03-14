"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useProductStore } from "@/stores";
import {
  useCreateProduct,
  useUpdateProduct,
  useCategories,
  useSuppliers,
} from "@/hooks/queries";
import { logger } from "@/lib/logger";
import ProductName from "./form-fields/NameField";
import SKU from "./form-fields/SKUField";
import Quantity from "./form-fields/QuantityField";
import Price from "./form-fields/PriceField";
import ImageField from "./form-fields/ImageField";
import ExpirationDateField from "./form-fields/ExpirationDateField";
import { Product } from "@/types";
import {
  productSchema,
  calculateProductStatus,
  type ProductFormData,
} from "@/lib/validations";

interface AddProductDialogProps {
  allProducts: Product[];
  userId: string;
  children?: React.ReactNode;
}

export default function AddProductDialog({
  allProducts,
  userId,
  children,
}: AddProductDialogProps) {
  const methods = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      productName: "",
      sku: "",
      quantity: "" as unknown as number,
      price: "" as unknown as number,
      imageUrl: "",
      imageFileId: "",
      expirationDate: "",
      unitOfMeasure: "pcs",
      initialStock: "" as unknown as number,
    },
  });

  const { reset } = methods;

  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const dialogCloseRef = useRef<HTMLButtonElement | null>(null);

  // Keep UI state in Zustand (openProductDialog, selectedProduct)
  const {
    setOpenProductDialog,
    openProductDialog,
    setSelectedProduct,
    selectedProduct,
  } = useProductStore();

  // Use TanStack Query for data fetching
  const { data: suppliers = [] } = useSuppliers();

  const activeSuppliers = suppliers.filter(
    (supplier) => supplier.status !== false || supplier.id === selectedSupplier
  );

  // Use TanStack Query mutations
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();

  useEffect(() => {
    if (selectedProduct) {
      reset({
        productName: selectedProduct.name,
        sku: selectedProduct.sku,
        quantity: selectedProduct.quantity,
        price: selectedProduct.price,
        imageUrl: selectedProduct.imageUrl || "",
        imageFileId: selectedProduct.imageFileId || "",
        expirationDate: selectedProduct.expirationDate
          ? new Date(selectedProduct.expirationDate).toISOString().split("T")[0]
          : "",
        unitOfMeasure: (selectedProduct as any).unitOfMeasure || "pcs",
        initialStock: (selectedProduct as any).initialStock || 0,
      });
      setSelectedSupplier(selectedProduct.supplierId || "");
    } else {
      // Reset form to default values for adding a new product
      reset({
        productName: "",
        sku: "",
        quantity: "" as unknown as number,
        price: "" as unknown as number,
        imageUrl: "",
        imageFileId: "",
        expirationDate: "",
        unitOfMeasure: "pcs",
        initialStock: "" as unknown as number,
      });
      setSelectedSupplier("");
    }
  }, [selectedProduct, openProductDialog, reset]);

  const onSubmit = async (data: ProductFormData) => {
    // Convert empty strings to 0 for quantity and price
    const quantity =
      typeof data.quantity === "string" && data.quantity === ""
        ? 0
        : Number(data.quantity);
    const price =
      typeof data.price === "string" && data.price === ""
        ? 0
        : Number(data.price);
    const initialStock =
      typeof data.initialStock === "string" && data.initialStock === ""
        ? 0
        : Number(data.initialStock);

    // Calculate status - always returns a valid ProductStatus
    const status = calculateProductStatus(quantity);

    // Format expiration date (convert to ISO string or null)
    const expirationDate =
      data.expirationDate && data.expirationDate !== ""
        ? new Date(data.expirationDate).toISOString()
        : null;

    try {
      if (!selectedProduct) {
        // Create new product using TanStack Query mutation
        await createProductMutation.mutateAsync({
          name: data.productName,
          sku: data.sku,
          price: price,
          quantity: quantity,
          status,
          supplierId: selectedSupplier,
          userId: userId,
          imageUrl: data.imageUrl || undefined,
          imageFileId: data.imageFileId || undefined,
          expirationDate: expirationDate || undefined,
          unitOfMeasure: data.unitOfMeasure,
          initialStock: initialStock,
        });

        // Close dialog on success (toast is handled by mutation hook)
        dialogCloseRef.current?.click();
        setOpenProductDialog(false);
      } else {
        // Update existing product using TanStack Query mutation
        await updateProductMutation.mutateAsync({
          id: selectedProduct.id,
          name: data.productName,
          sku: data.sku,
          price: price,
          quantity: quantity,
          status,
          supplierId: selectedSupplier,
          imageUrl: data.imageUrl || undefined,
          imageFileId: data.imageFileId || undefined,
          expirationDate: expirationDate,
          unitOfMeasure: data.unitOfMeasure,
        });

        // Close dialog on success (toast is handled by mutation hook)
        setOpenProductDialog(false);
      }
    } catch (error) {
      // Error toast is handled by the mutation hooks
      // Just log for debugging
      logger.error("Product operation error:", error);
    }
  };

  const isSubmitting = createProductMutation.isPending || updateProductMutation.isPending;
  const isFormValid = !!methods.watch("productName") && !!methods.watch("sku") && !!selectedSupplier;

  const handleOpenChange = (open: boolean) => {
    if (open) {
      // When opening the dialog for adding a new product, clear any selected product
      setSelectedProduct(null);
    } else {
      // When closing the dialog, also clear the selected product to ensure clean state
      setSelectedProduct(null);
    }
    setOpenProductDialog(open);
  };

  return (
    <Dialog open={openProductDialog} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button className="h-10 font-semibold inline-flex items-center justify-center rounded-xl border text-white  backdrop-blur-sm transition duration-200 dark:">
            +Add Product
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className="p-4 sm:p-7 sm:px-8 poppins max-h-[90vh] overflow-y-auto  "
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-[22px] text-white">
            {selectedProduct ? "Update Product" : "Add Product"}
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Enter the details of the product below.
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...methods}>
          {/* react-hook-form handleSubmit passes a ref; rule is for raw refs during render */}
          {/* eslint-disable-next-line react-hooks/refs */}
          <form onSubmit={methods.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ProductName />
              <SKU allProducts={allProducts} />
              <Quantity />
              <Price />
              <div className="mt-5 flex flex-col gap-2">
                <label className="text-sm font-medium text-white/80">
                  Unit of Measure
                </label>
                <input
                  {...methods.register("unitOfMeasure")}
                  className="h-11 w-full rounded-lg border dark:border-white/20 bg-white/10 dark:bg-white/5 backdrop-blur-sm px-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-rose-500/50 "
                  placeholder="e.g. pcs, kg, box"
                />
              </div>
              {!selectedProduct && (
                <div className="mt-5 flex flex-col gap-2">
                  <label className="text-sm font-medium text-white/80">
                    Initial Stock (Optional)
                  </label>
                  <input
                    {...methods.register("initialStock")}
                    type="number"
                    className="h-11 w-full rounded-lg border dark:border-white/20 bg-white/10 dark:bg-white/5 backdrop-blur-sm px-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-rose-500/50 "
                    placeholder="0"
                  />
                </div>
              )}
              <ExpirationDateField />
              <ImageField />
              <div className="mt-5 flex flex-col gap-2">
                <label className="text-sm font-medium text-white/80">
                  Supplier
                </label>
                <Select
                  value={selectedSupplier || undefined}
                  onValueChange={(value) => setSelectedSupplier(value)}
                >
                  <SelectTrigger className="h-11 w-full dark:border-white/20 bg-white/10 dark:bg-white/5 backdrop-blur-sm text-white placeholder:text-white/40 focus:ring-rose-500/50 ">
                    <SelectValue placeholder="Select Supplier" />
                  </SelectTrigger>
                  <SelectContent
                    className="dark:border-white/10 bg-white/80 dark:bg-popover/50 backdrop-blur-sm z-[100]"
                    position="popper"
                    sideOffset={5}
                    align="start"
                  >
                    {activeSuppliers.map((supplier) => (
                      <SelectItem
                        key={supplier.id}
                        value={supplier.id}
                        className="cursor-pointer text-gray-900 dark:text-white focus:bg-rose-100 dark:focus:bg-white/10 focus:text-gray-900 dark:focus:text-white"
                      >
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="mt-9 mb-4 flex flex-col sm:flex-row items-center gap-4">
              <DialogClose asChild>
                <Button
                  ref={dialogCloseRef}
                  variant="secondary"
                  className="h-11 w-full sm:w-auto px-11 inline-flex items-center justify-center rounded-xl border border-white/10 dark:bg-background/50 backdrop-blur-sm   transition duration-200 dark:hover:bg-accent/50 hover:border-white/20 dark:hover:border-white/20  dark:"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                className="h-11 w-full sm:w-auto px-11 inline-flex items-center justify-center rounded-xl border text-white  backdrop-blur-sm transition duration-200 dark: disabled:opacity-50"
                disabled={isSubmitting || !isFormValid}
              >
                {isSubmitting
                  ? "Loading..."
                  : selectedProduct
                  ? "Update Product"
                  : "Add Product"}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
