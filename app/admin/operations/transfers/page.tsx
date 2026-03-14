"use client";

import React, { useState, useEffect } from "react";
import { PageContentWrapper } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ArrowRightLeft, MoveRight } from "lucide-react";

export default function TransfersPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedProduct, setSelectedProduct] = useState("");
  const [fromWarehouse, setFromWarehouse] = useState("");
  const [toWarehouse, setToWarehouse] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prodRes, WHRes, trfRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/warehouses"),
        fetch("/api/operations/transfers"),
      ]);
      setProducts(await prodRes.json());
      setWarehouses(await WHRes.json());
      setTransfers(await trfRes.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !fromWarehouse || !toWarehouse || !quantity) {
      toast({ title: "Error", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }

    try {
      const res = await fetch("/api/operations/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct,
          fromWarehouseId: fromWarehouse,
          toWarehouseId: toWarehouse,
          quantity: parseInt(quantity),
          notes,
        }),
      });

      if (res.ok) {
        toast({ title: "Success", description: "Stock transferred successfully." });
        setQuantity("");
        setNotes("");
        fetchData();
      } else {
        const error = await res.json();
        toast({ title: "Error", description: error.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to transfer stock.", variant: "destructive" });
    }
  };

  return (
    <PageContentWrapper>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Internal Transfers</h1>
        <p className="text-muted-foreground">Move stock between different warehouse locations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transfer Form */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-xl border shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-sky-500" /> New Transfer
            </h2>
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

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-sm font-medium">From Warehouse</label>
                  <Select onValueChange={setFromWarehouse} value={fromWarehouse}>
                    <SelectTrigger>
                      <SelectValue placeholder="Source" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((w) => (
                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-center -my-2">
                  <MoveRight className="h-4 w-4 text-muted-foreground rotate-90 lg:rotate-0" />
                </div>
                <div>
                  <label className="text-sm font-medium">To Warehouse</label>
                  <Select onValueChange={setToWarehouse} value={toWarehouse}>
                    <SelectTrigger>
                      <SelectValue placeholder="Destination" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((w) => (
                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Quantity</label>
                <Input 
                  type="number" 
                  value={quantity} 
                  onChange={(e) => setQuantity(e.target.value)} 
                  placeholder="0"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Notes (Optional)</label>
                <Input 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  placeholder="e.g. Replenishment"
                />
              </div>

              <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-700">Execute Transfer</Button>
            </form>
          </div>
        </div>

        {/* Transfer History */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="p-4 bg-muted/50 border-b">
              <h2 className="text-lg font-semibold">Transfer History</h2>
            </div>
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Product ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={4} className="px-4 py-4 text-center text-sm">Loading...</td></tr>
                ) : transfers.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-4 text-center text-sm">No transfers found.</td></tr>
                ) : transfers.map((t) => (
                  <tr key={t.id} className="text-sm hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">{format(new Date(t.createdAt), "MMM d, HH:mm")}</td>
                    <td className="px-4 py-3 font-mono text-xs">{t.productId.slice(-6)}</td>
                    <td className="px-4 py-3 font-semibold">{t.quantity.toString()}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                        {t.status}
                      </span>
                    </td>
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
