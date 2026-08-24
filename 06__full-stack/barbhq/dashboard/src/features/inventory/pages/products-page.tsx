import React, { useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { PageContainer } from "../../../components/layout/PageContainer";
import { PageHeader } from "../../../components/layout/PageHeader";
import { Button } from "../../../components/ui/button";
import { InventoryNav } from "../components/inventory-nav";
import { ProductTable } from "../components/product-table";
import { ProductFormModal } from "../components/product-form-modal";
import { StockAdjustmentDialog } from "../components/stock-adjustment-dialog";
import { INITIAL_CATEGORIES, type InventoryItem } from "../inventory.types";
import {
  useInventoryProducts,
  useInventorySuppliers,
} from "../inventory.queries";
import {
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useAdjustStockMutation,
} from "../inventory.mutations";
import type { ProductFormValues, AdjustStockFormValues } from "../inventory.schemas";

export const ProductsPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [stockStatus, setStockStatus] = useState<"ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK">("ALL");

  const { data: products = [], isLoading } = useInventoryProducts({
    search,
    categoryId: selectedCategory === "ALL" ? undefined : selectedCategory,
    stockStatus,
  });

  const { data: suppliers = [] } = useInventorySuppliers();

  const createProductMutation = useCreateProductMutation();
  const updateProductMutation = useUpdateProductMutation();
  const deleteProductMutation = useDeleteProductMutation();
  const adjustStockMutation = useAdjustStockMutation();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<InventoryItem | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<InventoryItem | null>(null);

  const handleCreateOrUpdate = (data: ProductFormValues) => {
    if (editingProduct) {
      updateProductMutation.mutate(
        { id: editingProduct.id, data },
        {
          onSuccess: () => {
            setIsFormModalOpen(false);
            setEditingProduct(null);
          },
        },
      );
    } else {
      createProductMutation.mutate(data, {
        onSuccess: () => {
          setIsFormModalOpen(false);
        },
      });
    }
  };

  const handleAdjustStock = (payload: AdjustStockFormValues) => {
    if (!adjustingProduct) return;
    adjustStockMutation.mutate(
      { id: adjustingProduct.id, payload },
      {
        onSuccess: () => {
          setAdjustingProduct(null);
        },
      },
    );
  };

  return (
    <PageContainer>
      <PageHeader
        title="Product Directory"
        description="Browse, filter, and manage shop products, equipment, and supply inventory"
        actions={
          <Button
            onClick={() => {
              setEditingProduct(null);
              setIsFormModalOpen(true);
            }}
            className="cursor-pointer font-bold gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        }
      />

      <InventoryNav />

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 p-4 rounded-xl border border-border bg-card shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name, SKU..."
            className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary cursor-pointer w-full sm:w-auto"
            >
              <option value="ALL">All Categories</option>
              {INITIAL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <select
            value={stockStatus}
            onChange={(e) => setStockStatus(e.target.value as any)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary cursor-pointer w-full sm:w-auto"
          >
            <option value="ALL">All Stock Statuses</option>
            <option value="IN_STOCK">🟢 In Stock</option>
            <option value="LOW_STOCK">🟡 Low Stock</option>
            <option value="OUT_OF_STOCK">🔴 Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="h-64 bg-card rounded-xl border border-border animate-pulse" />
      ) : (
        <ProductTable
          products={products}
          onAdjustStock={(p) => setAdjustingProduct(p)}
          onEditProduct={(p) => {
            setEditingProduct(p);
            setIsFormModalOpen(true);
          }}
          onDeleteProduct={(id) => deleteProductMutation.mutate(id)}
        />
      )}

      {/* Modals */}
      <ProductFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleCreateOrUpdate}
        isLoading={createProductMutation.isPending || updateProductMutation.isPending}
        initialData={editingProduct}
        suppliers={suppliers}
      />

      <StockAdjustmentDialog
        isOpen={Boolean(adjustingProduct)}
        onClose={() => setAdjustingProduct(null)}
        onSubmit={handleAdjustStock}
        isLoading={adjustStockMutation.isPending}
        product={adjustingProduct}
      />
    </PageContainer>
  );
};
