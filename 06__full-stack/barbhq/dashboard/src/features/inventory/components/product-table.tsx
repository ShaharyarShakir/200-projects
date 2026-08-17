import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  MoreVertical,
  SlidersHorizontal,
  Edit2,
  Trash2,
  Eye,
  Package,
} from "lucide-react";
import { StockStatusBadge } from "./stock-status-badge";
import type { InventoryItem } from "../inventory.types";

interface ProductTableProps {
  products: InventoryItem[];
  onAdjustStock: (product: InventoryItem) => void;
  onEditProduct: (product: InventoryItem) => void;
  onDeleteProduct: (productId: string) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  onAdjustStock,
  onEditProduct,
  onDeleteProduct,
}) => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-border bg-card">
        <Package className="h-12 w-12 text-muted-foreground/50 mb-3" />
        <h3 className="text-base font-bold">No Products Found</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          No inventory products match your search or filter criteria. Add a new product to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 border-b border-border text-xs uppercase font-bold text-muted-foreground">
            <tr>
              <th className="px-4 py-3.5">Product</th>
              <th className="px-4 py-3.5">Category</th>
              <th className="px-4 py-3.5">Stock</th>
              <th className="px-4 py-3.5">Unit Cost</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((product) => {
              const categoryName =
                typeof product.categoryId === "object"
                  ? product.categoryId.name
                  : product.categoryName || "Uncategorized";

              return (
                <tr
                  key={product.id}
                  className="hover:bg-muted/30 transition-colors group"
                >
                  <td className="px-4 py-3.5">
                    <Link
                      to="/app/inventory/products/$productId"
                      params={{ productId: product.id }}
                      className="font-bold text-foreground hover:text-primary transition-colors block"
                    >
                      {product.name}
                    </Link>
                    <span className="font-mono text-xs text-muted-foreground">
                      SKU: {product.sku}
                    </span>
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-muted text-muted-foreground">
                      {categoryName}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 font-bold text-foreground">
                    {product.currentQuantity}{" "}
                    <span className="text-xs text-muted-foreground font-normal">
                      {product.unit.toLowerCase()}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 text-foreground font-medium">
                    ₨{product.averageCost.toLocaleString("en-PK")}
                  </td>

                  <td className="px-4 py-3.5">
                    <StockStatusBadge
                      currentQuantity={product.currentQuantity}
                      minimumQuantity={product.minimumQuantity}
                    />
                  </td>

                  <td className="px-4 py-3.5 text-right relative">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onAdjustStock(product)}
                        title="Adjust Stock"
                        className="px-2.5 py-1 text-xs font-semibold rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
                      >
                        Adjust
                      </button>

                      <div className="relative">
                        <button
                          onClick={() =>
                            setActiveMenuId(
                              activeMenuId === product.id ? null : product.id,
                            )
                          }
                          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {activeMenuId === product.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setActiveMenuId(null)}
                            />
                            <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-lg border border-border bg-card p-1 shadow-lg text-left text-xs font-medium">
                              <Link
                                to="/app/inventory/products/$productId"
                                params={{ productId: product.id }}
                                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted text-foreground cursor-pointer"
                                onClick={() => setActiveMenuId(null)}
                              >
                                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                View Details
                              </Link>
                              <button
                                onClick={() => {
                                  onAdjustStock(product);
                                  setActiveMenuId(null);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 rounded-md hover:bg-muted text-foreground cursor-pointer"
                              >
                                <SlidersHorizontal className="h-3.5 w-3.5 text-amber-500" />
                                Adjust Stock
                              </button>
                              <button
                                onClick={() => {
                                  onEditProduct(product);
                                  setActiveMenuId(null);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 rounded-md hover:bg-muted text-foreground cursor-pointer"
                              >
                                <Edit2 className="h-3.5 w-3.5 text-blue-500" />
                                Edit Product
                              </button>
                              <button
                                onClick={() => {
                                  if (
                                    confirm(
                                      `Are you sure you want to delete "${product.name}"?`,
                                    )
                                  ) {
                                    onDeleteProduct(product.id);
                                  }
                                  setActiveMenuId(null);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 rounded-md hover:bg-rose-500/10 text-rose-500 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete Product
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
