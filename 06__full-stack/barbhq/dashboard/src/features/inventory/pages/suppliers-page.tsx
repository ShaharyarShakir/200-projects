import React, { useState } from "react";
import { Plus } from "lucide-react";
import { PageContainer } from "../../../components/layout/PageContainer";
import { PageHeader } from "../../../components/layout/PageHeader";
import { Button } from "../../../components/ui/button";
import { InventoryNav } from "../components/inventory-nav";
import { SuppliersTable } from "../components/suppliers-table";
import { SupplierFormModal } from "../components/supplier-form-modal";
import { useInventorySuppliers } from "../inventory.queries";
import {
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
} from "../inventory.mutations";
import type { SupplierFormValues } from "../inventory.schemas";
import type { Vendor } from "../inventory.types";

export const SuppliersPage: React.FC = () => {
  const { data: suppliers = [], isLoading } = useInventorySuppliers();

  const createSupplierMutation = useCreateSupplierMutation();
  const updateSupplierMutation = useUpdateSupplierMutation();
  const deleteSupplierMutation = useDeleteSupplierMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Vendor | null>(null);

  const handleCreateOrUpdate = (data: SupplierFormValues) => {
    if (editingSupplier) {
      updateSupplierMutation.mutate(
        { id: editingSupplier.id, data },
        {
          onSuccess: () => {
            setIsModalOpen(false);
            setEditingSupplier(null);
          },
        },
      );
    } else {
      createSupplierMutation.mutate(data, {
        onSuccess: () => setIsModalOpen(false),
      });
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Suppliers & Vendors Directory"
        description="Manage vendor supplier contacts, address details, and supply channels"
        actions={
          <Button
            onClick={() => {
              setEditingSupplier(null);
              setIsModalOpen(true);
            }}
            className="cursor-pointer font-bold gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add Supplier
          </Button>
        }
      />

      <InventoryNav />

      {isLoading ? (
        <div className="h-64 bg-card rounded-xl border border-border animate-pulse" />
      ) : (
        <SuppliersTable
          suppliers={suppliers}
          onEditSupplier={(sup) => {
            setEditingSupplier(sup);
            setIsModalOpen(true);
          }}
          onDeleteSupplier={(id) => deleteSupplierMutation.mutate(id)}
        />
      )}

      <SupplierFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSupplier(null);
        }}
        onSubmit={handleCreateOrUpdate}
        isLoading={createSupplierMutation.isPending || updateSupplierMutation.isPending}
        initialData={editingSupplier}
      />
    </PageContainer>
  );
};
