"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MdError } from "react-icons/md";
import { useFormContext } from "react-hook-form";

export default function ProductName() {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <div className="mt-5 flex flex-col gap-2">
      <Label htmlFor="product-name" className="text-white/80">
        {`Product's Name`}
      </Label>
      <div className="flex gap-2 items-center">
        <Input
          {...register("productName")}
          type="text"
          id="product-name"
          className="h-11 bg-white/10 dark:bg-white/5 backdrop-blur-sm border dark:border-white/20 text-white placeholder:text-white/40 focus-visible: focus-visible:ring-rose-500/50 "
          placeholder="Laptop..."
        />
      </div>

      {errors.productName && (
        <div className="text-red-500 flex gap-1 items-center text-[13px]">
          <MdError />
          <p>The product name is required</p>
        </div>
      )}
    </div>
  );
}
