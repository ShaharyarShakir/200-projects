import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { ShoppingCart } from "lucide-react";

export const Route = createFileRoute("/pos")({
  component: PosPage,
});

function PosPage() {
  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Point of Sale (POS)"
        description="Fast checkout register for appointments, walk-ins, services, and product sales"
      />
      <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-2xl bg-card/40 text-center select-none">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
          <ShoppingCart className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-bold text-foreground">POS Billing Terminal</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Page coming soon in Sprint 3 Phase 5
        </p>
      </div>
    </PageContainer>
  );
}

export default PosPage;
