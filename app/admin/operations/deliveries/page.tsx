"use client";

import React, { useState, useEffect } from "react";
import { PageContentWrapper } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Truck, ArrowRight, Package } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts";

export default function DeliveriesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      // Only show pending or confirmed orders for delivery workflow
      setOrders(data.filter((o: any) => o.status === "pending" || o.status === "confirmed" || o.status === "processing"));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (id: string, currentStatus: string) => {
    let nextStatus = "confirmed";
    if (currentStatus === "confirmed") nextStatus = "processing";
    if (currentStatus === "processing") nextStatus = "shipped";

    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        toast({ title: "Success", description: `Order moved to ${nextStatus}. Stock updated if confirmed.` });
        fetchOrders();
      } else {
        const error = await res.json();
        toast({ title: "Error", description: error.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update order status.", variant: "destructive" });
    }
  };

  return (
    <PageContentWrapper>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Delivery Orders (Outgoing Stock)</h1>
          <p className="text-muted-foreground">Pick, pack, and validate orders for shipment.</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Order #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Items</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm">Loading orders...</td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm">No pending deliveries.</td>
              </tr>
            ) : orders.map((o) => (
              <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{o.orderNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{o.placedByName || "Guest"}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                   <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize 
                    ${o.status === 'pending' ? 'bg-amber-100 text-amber-800' : 
                      o.status === 'confirmed' ? 'bg-blue-100 text-blue-800' : 
                      'bg-emerald-100 text-emerald-800'}`}>
                    {o.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {o.items?.length || 0} product(s)
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1"
                    onClick={() => handleValidate(o.id, o.status)}
                  >
                    {o.status === 'pending' ? 'Validate (Confirm)' : 
                     o.status === 'confirmed' ? 'Start Packing' : 
                     'Mark as Shipped'} 
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageContentWrapper>
  );
}
