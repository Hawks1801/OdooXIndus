"use client";

import React, { useState, useEffect } from "react";
import { PageContentWrapper } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts";
import { format } from "date-fns";

export default function AdjustmentsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [physicalCount, setPhysicalCount] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prodRes, WHRes, adjRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/warehouses"),
        fetch("/api/operations/adjustments"),
      ]);
      setProducts(await prodRes.json());
      setWarehouses(await WHRes.json());
      setAdjustments(await adjRes.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !selectedWarehouse || !physicalCount) {
      toast({ title: "Error", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }

    try {
      const res = await fetch("/api/operations/adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct,
          warehouseId: selectedWarehouse,
          adjustedQty: parseInt(physicalCount),
          reason,
        }),
      });

      if (res.ok) {
        toast({ title: "Success", description: "Stock adjusted successfully." });
        setPhysicalCount("");
        setReason("");
        fetchData();
      } else {
        const error = await res.json();
        toast({ title: "Error", description: error.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to adjust stock.", variant: "destructive" });
    }
  };

  return (
    <PageContentWrapper>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Inventory Adjustment</h1>
        <p className="text-muted-foreground">Fix mismatches between recorded stock and physical count.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Adjustment Form */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-xl border shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Create Adjustment</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Product</label>
                <Select onValueChange={setSelectedProduct} value={selectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Warehouse</label>
                <Select onValueChange={setSelectedWarehouse} value={selectedWarehouse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((w) => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Physical Count</label>
                <Input 
                  type="number" 
                  value={physicalCount} 
                  onChange={(e) => setPhysicalCount(e.target.value)} 
                  placeholder="Enter actual count"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Reason (Optional)</label>
                <Input 
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)} 
                  placeholder="e.g. Damaged, Lost, Found"
                />
              </div>

              <Button type="submit" className="w-full">Apply Adjustment</Button>
            </form>
          </div>
        </div>

        {/* Adjustment History */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="p-4 bg-muted/50 border-b">
              <h2 className="text-lg font-semibold">Adjustment History</h2>
            </div>
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Diff</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={4} className="px-4 py-4 text-center text-sm">Loading...</td></tr>
                ) : adjustments.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-4 text-center text-sm">No adjustments yet.</td></tr>
                ) : adjustments.map((a) => (
                  <tr key={a.id} className="text-sm">
                    <td className="px-4 py-3">{format(new Date(a.createdAt), "MMM d, HH:mm")}</td>
                    <td className="px-4 py-3 font-medium">{a.product?.name}</td>
                    <td className={`px-4 py-3 font-bold ${a.difference > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {a.difference > 0 ? `+${a.difference}` : a.difference}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{a.reason || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageContentWrapper>
  );
}
