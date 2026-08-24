import React, { useState } from "react";
import { Plus } from "lucide-react";
import { PageContainer } from "../../../components/layout/PageContainer";
import { PageHeader } from "../../../components/layout/PageHeader";
import { Button } from "../../../components/ui/button";
import { InventoryNav } from "../components/inventory-nav";
import { ConsumptionTable } from "../components/consumption-table";
import { ConsumptionFormModal } from "../components/consumption-form-modal";
import {
  useInventoryMovements,
  useInventoryProducts,
} from "../inventory.queries";
import { useRecordConsumptionMutation } from "../inventory.mutations";
import type { ConsumptionFormValues } from "../inventory.schemas";

export const ConsumptionPage: React.FC = () => {
  const { data: movements = [], isLoading } = useInventoryMovements(100);
  const { data: products = [] } = useInventoryProducts();

  const recordConsumptionMutation = useRecordConsumptionMutation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const consumptionLogs = movements.filter((m) => m.type === "CONSUMPTION");

  const handleRecordConsumption = (data: ConsumptionFormValues) => {
    recordConsumptionMutation.mutate(data, {
      onSuccess: () => setIsModalOpen(false),
    });
  };

  return (
    <PageContainer>
      <PageHeader
        title="Stock Consumption Log"
        description="Track product and supply usage during customer services or shop maintenance"
        actions={
          <Button
            onClick={() => setIsModalOpen(true)}
            className="cursor-pointer font-bold gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Record Consumption
          </Button>
        }
      />

      <InventoryNav />

      {isLoading ? (
        <div className="h-64 bg-card rounded-xl border border-border animate-pulse" />
      ) : (
        <ConsumptionTable
          consumptionLogs={consumptionLogs}
          title="Consumed Products History"
        />
      )}

      <ConsumptionFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleRecordConsumption}
        isLoading={recordConsumptionMutation.isPending}
        products={products}
      />
    </PageContainer>
  );
};
