import React, { useState } from "react";
import { Plus, ShoppingCart, TrendingDown, RefreshCw } from "lucide-react";
import { PageContainer } from "../../../components/layout/PageContainer";
import { PageHeader } from "../../../components/layout/PageHeader";
import { Button } from "../../../components/ui/button";
import { InventoryNav } from "../components/inventory-nav";
import { InventorySummary } from "../components/inventory-summary";
import { StockAlertsCard } from "../components/stock-alerts-card";
import { ProductFormModal } from "../components/product-form-modal";
import { PurchaseFormModal } from "../components/purchase-form-modal";
import { ConsumptionFormModal } from "../components/consumption-form-modal";
import { PurchasesTable } from "../components/purchases-table";
import { ConsumptionTable } from "../components/consumption-table";
import {
  useInventoryOverview,
  useInventorySuppliers,
  useInventoryProducts,
} from "../inventory.queries";
import {
  useCreateProductMutation,
  useCreatePurchaseMutation,
  useRecordConsumptionMutation,
  useReceivePurchaseMutation,
} from "../inventory.mutations";
import type {
  ProductFormValues,
  PurchaseOrderFormValues,
  ConsumptionFormValues,
} from "../inventory.schemas";

export const InventoryOverviewPage: React.FC = () => {
  const { data: overview, isLoading, refetch } = useInventoryOverview();
  const { data: suppliers = [] } = useInventorySuppliers();
  const { data: products = [] } = useInventoryProducts();

  const createProductMutation = useCreateProductMutation();
  const createPurchaseMutation = useCreatePurchaseMutation();
  const recordConsumptionMutation = useRecordConsumptionMutation();
  const receivePurchaseMutation = useReceivePurchaseMutation();

  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isRecordPurchaseOpen, setIsRecordPurchaseOpen] = useState(false);
  const [isRecordConsumptionOpen, setIsRecordConsumptionOpen] = useState(false);

  const handleCreateProduct = (data: ProductFormValues) => {
    createProductMutation.mutate(data, {
      onSuccess: () => setIsAddProductOpen(false),
    });
  };

  const handleCreatePurchase = (data: PurchaseOrderFormValues) => {
    createPurchaseMutation.mutate(data, {
      onSuccess: () => setIsRecordPurchaseOpen(false),
    });
  };

  const handleRecordConsumption = (data: ConsumptionFormValues) => {
    recordConsumptionMutation.mutate(data, {
      onSuccess: () => setIsRecordConsumptionOpen(false),
    });
  };

  const handleReceivePurchase = (id: string, items: any[]) => {
    receivePurchaseMutation.mutate({ id, items });
  };

  return (
    <PageContainer>
      <PageHeader
        title="Inventory"
        description="Manage shop stock, purchase orders, and daily supply consumption"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="cursor-pointer gap-1.5"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRecordConsumptionOpen(true)}
              className="cursor-pointer gap-1.5"
            >
              <TrendingDown className="h-4 w-4" />
              Record Consumption
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRecordPurchaseOpen(true)}
              className="cursor-pointer gap-1.5"
            >
              <ShoppingCart className="h-4 w-4" />
              Record Purchase
            </Button>
            <Button
              onClick={() => setIsAddProductOpen(true)}
              className="cursor-pointer font-bold gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </div>
        }
      />

      <InventoryNav />

      {isLoading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-28 bg-card rounded-xl border border-border" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-card rounded-xl border border-border" />
            <div className="h-64 bg-card rounded-xl border border-border" />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <InventorySummary
            totalProducts={overview?.totalProducts || 0}
            lowStockCount={overview?.lowStockCount || 0}
            outOfStockCount={overview?.outOfStockCount || 0}
            totalStockValue={overview?.totalStockValue || 0}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <StockAlertsCard alerts={overview?.alerts} />
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
                <h3 className="font-bold text-base mb-3">Quick Shop Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => setIsAddProductOpen(true)}
                    className="flex flex-col items-center justify-center p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted transition-all text-center cursor-pointer group"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2 group-hover:scale-105 transition-transform">
                      <Plus className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-bold">Add Product</span>
                    <span className="text-xs text-muted-foreground mt-0.5">
                      New item SKU
                    </span>
                  </button>

                  <button
                    onClick={() => setIsRecordPurchaseOpen(true)}
                    className="flex flex-col items-center justify-center p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted transition-all text-center cursor-pointer group"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 mb-2 group-hover:scale-105 transition-transform">
                      <ShoppingCart className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-bold">Record Purchase</span>
                    <span className="text-xs text-muted-foreground mt-0.5">
                      Restock from supplier
                    </span>
                  </button>

                  <button
                    onClick={() => setIsRecordConsumptionOpen(true)}
                    className="flex flex-col items-center justify-center p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted transition-all text-center cursor-pointer group"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 mb-2 group-hover:scale-105 transition-transform">
                      <TrendingDown className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-bold">Log Consumption</span>
                    <span className="text-xs text-muted-foreground mt-0.5">
                      Service usage
                    </span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold text-sm mb-3">Recent Purchases</h4>
                  <PurchasesTable
                    purchases={overview?.recentPurchases || []}
                    onReceivePurchase={handleReceivePurchase}
                    isReceiving={receivePurchaseMutation.isPending}
                  />
                </div>

                <div>
                  <h4 className="font-bold text-sm mb-3">Recent Consumption</h4>
                  <ConsumptionTable
                    consumptionLogs={overview?.recentConsumption || []}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ProductFormModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onSubmit={handleCreateProduct}
        isLoading={createProductMutation.isPending}
        suppliers={suppliers}
      />

      <PurchaseFormModal
        isOpen={isRecordPurchaseOpen}
        onClose={() => setIsRecordPurchaseOpen(false)}
        onSubmit={handleCreatePurchase}
        isLoading={createPurchaseMutation.isPending}
        suppliers={suppliers}
        products={products}
      />

      <ConsumptionFormModal
        isOpen={isRecordConsumptionOpen}
        onClose={() => setIsRecordConsumptionOpen(false)}
        onSubmit={handleRecordConsumption}
        isLoading={recordConsumptionMutation.isPending}
        products={products}
      />
    </PageContainer>
  );
};
