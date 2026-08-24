import React, { useState } from "react";
import { useParams, Link } from "@tanstack/react-router";
import { ArrowLeft, SlidersHorizontal, Edit2 } from "lucide-react";
import { PageContainer } from "../../../components/layout/PageContainer";
import { Button } from "../../../components/ui/button";
import { StockStatusBadge } from "../components/stock-status-badge";
import { InventoryHistoryTable } from "../components/inventory-history-table";
import { ProductFormModal } from "../components/product-form-modal";
import { StockAdjustmentDialog } from "../components/stock-adjustment-dialog";
import {
  useInventoryProduct,
  useProductMovements,
  useInventorySuppliers,
} from "../inventory.queries";
import {
  useUpdateProductMutation,
  useAdjustStockMutation,
} from "../inventory.mutations";
import type { ProductFormValues, AdjustStockFormValues } from "../inventory.schemas";
import { cn } from "../../../lib/utils";

export const ProductDetailsPage: React.FC = () => {
  const { productId } = useParams({ from: "/app/inventory/products/$productId" });
  const { data: product, isLoading } = useInventoryProduct(productId);
  const { data: movements = [] } = useProductMovements(productId);
  const { data: suppliers = [] } = useInventorySuppliers();

  const updateProductMutation = useUpdateProductMutation();
  const adjustStockMutation = useAdjustStockMutation();

  const [activeTab, setActiveTab] = useState<"overview" | "history" | "purchases" | "consumption">("overview");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);

  const handleUpdate = (data: ProductFormValues) => {
    if (!product) return;
    updateProductMutation.mutate(
      { id: product.id, data },
      { onSuccess: () => setIsEditOpen(false) },
    );
  };

  const handleAdjust = (payload: AdjustStockFormValues) => {
    if (!product) return;
    adjustStockMutation.mutate(
      { id: product.id, payload },
      { onSuccess: () => setIsAdjustOpen(false) },
    );
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="h-64 bg-card rounded-xl border border-border animate-pulse" />
      </PageContainer>
    );
  }

  if (!product) {
    return (
      <PageContainer>
        <div className="p-12 text-center rounded-xl border border-border bg-card">
          <h2 className="text-lg font-bold">Product Not Found</h2>
          <Link
            to="/app/inventory/products"
            className="text-sm font-semibold text-primary hover:underline mt-2 inline-block"
          >
            ← Back to Products Directory
          </Link>
        </div>
      </PageContainer>
    );
  }

  const categoryName =
    typeof product.categoryId === "object"
      ? product.categoryId.name
      : product.categoryName || "Uncategorized";

  const stockValue = product.currentQuantity * product.averageCost;

  const purchaseMovements = movements.filter((m) => m.type === "PURCHASE");
  const consumptionMovements = movements.filter((m) => m.type === "CONSUMPTION");

  return (
    <PageContainer>
      {/* Back Link */}
      <Link
        to="/app/inventory/products"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Products
      </Link>

      {/* Header Card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-xs mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5 mb-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-foreground">{product.name}</h1>
              <StockStatusBadge
                currentQuantity={product.currentQuantity}
                minimumQuantity={product.minimumQuantity}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-semibold">
              Category: <span className="text-foreground">{categoryName}</span> · SKU:{" "}
              <span className="font-mono text-foreground">{product.sku}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsAdjustOpen(true)}
              className="cursor-pointer font-bold gap-1.5"
            >
              <SlidersHorizontal className="h-4 w-4 text-amber-500" />
              Adjust Stock
            </Button>
            <Button
              onClick={() => setIsEditOpen(true)}
              className="cursor-pointer font-bold gap-1.5"
            >
              <Edit2 className="h-4 w-4" />
              Edit Product
            </Button>
          </div>
        </div>

        {/* Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-lg bg-muted/40 border border-border">
            <p className="text-xs text-muted-foreground font-semibold uppercase">Current Stock</p>
            <p className="text-xl font-black mt-1 text-foreground">
              {product.currentQuantity}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                {product.unit.toLowerCase()}
              </span>
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-muted/40 border border-border">
            <p className="text-xs text-muted-foreground font-semibold uppercase">Minimum Stock</p>
            <p className="text-xl font-black mt-1 text-foreground">
              {product.minimumQuantity}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                {product.unit.toLowerCase()}
              </span>
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-muted/40 border border-border">
            <p className="text-xs text-muted-foreground font-semibold uppercase">Unit Cost</p>
            <p className="text-xl font-black mt-1 text-foreground">
              ₨{product.averageCost.toLocaleString("en-PK")}
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-muted/40 border border-border">
            <p className="text-xs text-muted-foreground font-semibold uppercase">Stock Value</p>
            <p className="text-xl font-black mt-1 text-emerald-500">
              ₨{stockValue.toLocaleString("en-PK")}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-border mb-6">
        {[
          { id: "overview", label: "Overview" },
          { id: "history", label: `Stock History (${movements.length})` },
          { id: "purchases", label: `Purchases (${purchaseMovements.length})` },
          { id: "consumption", label: `Consumption (${consumptionMovements.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "px-4 py-2.5 text-sm font-bold border-b-2 transition-colors cursor-pointer",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <h3 className="font-bold text-base border-b border-border pb-3 mb-3">
              Product Specification
            </h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground font-medium">Description:</dt>
                <dd className="font-semibold">{product.description || "No description provided"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground font-medium">Reorder Quantity:</dt>
                <dd className="font-semibold">{product.reorderQuantity || "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground font-medium">Retail Selling Price:</dt>
                <dd className="font-semibold">
                  {product.sellingPrice ? `₨${product.sellingPrice}` : "Not for retail sale"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground font-medium">Supplier:</dt>
                <dd className="font-semibold">{product.supplierName || "Default Supplier"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground font-medium">Track Stock:</dt>
                <dd className="font-semibold">{product.trackStock ? "Enabled" : "Disabled"}</dd>
              </div>
            </dl>
          </div>

          <div>
            <InventoryHistoryTable
              movements={movements.slice(0, 5)}
              title="Recent Movements"
            />
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <InventoryHistoryTable movements={movements} title="All Movements History" />
      )}

      {activeTab === "purchases" && (
        <InventoryHistoryTable movements={purchaseMovements} title="Purchase Stock Log" />
      )}

      {activeTab === "consumption" && (
        <InventoryHistoryTable movements={consumptionMovements} title="Consumption Log" />
      )}

      {/* Modals */}
      <ProductFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleUpdate}
        isLoading={updateProductMutation.isPending}
        initialData={product}
        suppliers={suppliers}
      />

      <StockAdjustmentDialog
        isOpen={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
        onSubmit={handleAdjust}
        isLoading={adjustStockMutation.isPending}
        product={product}
      />
    </PageContainer>
  );
};
