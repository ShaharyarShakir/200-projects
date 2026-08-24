import React, { useState } from "react";
import { Plus } from "lucide-react";
import { PageContainer } from "../../../components/layout/PageContainer";
import { PageHeader } from "../../../components/layout/PageHeader";
import { Button } from "../../../components/ui/button";
import { InventoryNav } from "../components/inventory-nav";
import { PurchasesTable } from "../components/purchases-table";
import { PurchaseFormModal } from "../components/purchase-form-modal";
import {
  useInventoryPurchases,
  useInventorySuppliers,
  useInventoryProducts,
} from "../inventory.queries";
import {
  useCreatePurchaseMutation,
  useReceivePurchaseMutation,
} from "../inventory.mutations";
import type { PurchaseOrderFormValues } from "../inventory.schemas";

export const PurchasesPage: React.FC = () => {
  const { data: purchases = [], isLoading } = useInventoryPurchases();
  const { data: suppliers = [] } = useInventorySuppliers();
  const { data: products = [] } = useInventoryProducts();

  const createPurchaseMutation = useCreatePurchaseMutation();
  const receivePurchaseMutation = useReceivePurchaseMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreatePurchase = (data: PurchaseOrderFormValues) => {
    createPurchaseMutation.mutate(data, {
      onSuccess: () => setIsModalOpen(false),
    });
  };

  const handleReceivePurchase = (id: string, items: any[]) => {
    receivePurchaseMutation.mutate({ id, items });
  };

  return (
    <PageContainer>
      <PageHeader
        title="Purchase Orders"
        description="Record stock restocks and track supplier shipments"
        actions={
          <Button
            onClick={() => setIsModalOpen(true)}
            className="cursor-pointer font-bold gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Record Purchase
          </Button>
        }
      />

      <InventoryNav />

      {isLoading ? (
        <div className="h-64 bg-card rounded-xl border border-border animate-pulse" />
      ) : (
        <PurchasesTable
          purchases={purchases}
          onReceivePurchase={handleReceivePurchase}
          isReceiving={receivePurchaseMutation.isPending}
        />
      )}

      <PurchaseFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreatePurchase}
        isLoading={createPurchaseMutation.isPending}
        suppliers={suppliers}
        products={products}
      />
    </PageContainer>
  );
};
