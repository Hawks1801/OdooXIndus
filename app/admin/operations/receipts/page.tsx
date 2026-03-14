"use client";

import React, { useState, useEffect } from "react";
import { PageContentWrapper } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle, Clock, XCircle, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts";

export default function ReceiptsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      const res = await fetch("/api/operations/receipts");
      const data = await res.json();
      setReceipts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (id: string) => {
    try {
      const res = await fetch(`/api/operations/receipts/${id}/validate`, {
        method: "POST",
      });
      if (res.ok) {
        toast({ title: "Success", description: "Receipt validated and stock updated." });
        fetchReceipts();
      } else {
        const error = await res.json();
        toast({ title: "Error", description: error.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to validate receipt.", variant: "destructive" });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "done": return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case "draft": return <Clock className="h-4 w-4 text-amber-500" />;
      case "canceled": return <XCircle className="h-4 w-4 text-rose-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <PageContentWrapper>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Receipts (Incoming Stock)</h1>
          <p className="text-muted-foreground">Manage and validate incoming goods from suppliers.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> New Receipt
        </Button>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Items</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm">Loading receipts...</td>
              </tr>
            ) : receipts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm">No receipts found.</td>
              </tr>
            ) : receipts.map((r) => (
              <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{r.receiptNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{format(new Date(r.createdAt), "MMM d, yyyy")}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2 text-sm capitalize">
                    {getStatusIcon(r.status)}
                    {r.status}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {r.items.length} product(s)
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  {r.status === "draft" && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 gap-1"
                      onClick={() => handleValidate(r.id)}
                    >
                      Validate <ArrowRight className="h-3 w-3" />
                    </Button>
                  )}
                  {r.status === "done" && (
                    <span className="text-emerald-600 font-medium">Stock Updated</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageContentWrapper>
  );
}
