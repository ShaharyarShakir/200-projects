import React, { useState } from "react";
import { PageContainer } from "../../../components/layout/PageContainer";
import { PageHeader } from "../../../components/layout/PageHeader";
import { InventoryNav } from "../components/inventory-nav";
import { InventoryHistoryTable } from "../components/inventory-history-table";
import { StockAdjustmentDialog } from "../components/stock-adjustment-dialog";
import {
  useInventoryMovements,
  useInventoryProducts,
} from "../inventory.queries";
import { useAdjustStockMutation } from "../inventory.mutations";
import type { AdjustStockFormValues } from "../inventory.schemas";
import type { InventoryItem } from "../inventory.types";

export const AdjustmentsPage: React.FC = () => {
  const { data: movements = [], isLoading } = useInventoryMovements(100);
  const { data: products = [] } = useInventoryProducts();

  const adjustStockMutation = useAdjustStockMutation();
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);

  const adjustments = movements.filter(
    (m) => m.type === "ADJUSTMENT" || m.type === "AUDIT",
  );

  const handleAdjustStock = (payload: AdjustStockFormValues) => {
    if (!selectedProduct) return;
    adjustStockMutation.mutate(
      { id: selectedProduct.id, payload },
      { onSuccess: () => setSelectedProduct(null) },
    );
  };

  return (
    <PageContainer>
      <PageHeader
        title="Stock Adjustments Audit Log"
        description="Audit manual inventory level adjustments, damaged items, and opening balances"
        actions={
          <div className="flex items-center gap-2">
            <select
              onChange={(e) => {
                const found = products.find((p) => p.id === e.target.value);
                if (found) setSelectedProduct(found);
              }}
              value=""
              className="rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary cursor-pointer"
            >
              <option value="" disabled>
                Select Product to Adjust...
              </option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.currentQuantity} {p.unit.toLowerCase()})
                </option>
              ))}
            </select>
          </div>
        }
      />

      <InventoryNav />

      {isLoading ? (
        <div className="h-64 bg-card rounded-xl border border-border animate-pulse" />
      ) : (
        <InventoryHistoryTable
          movements={adjustments}
          title="Manual Adjustments Log"
        />
      )}

      <StockAdjustmentDialog
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        onSubmit={handleAdjustStock}
        isLoading={adjustStockMutation.isPending}
        product={selectedProduct}
      />
    </PageContainer>
  );
};
