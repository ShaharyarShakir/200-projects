import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { DollarSign } from "lucide-react";

export const Route = createFileRoute("/finance")({
  component: FinancePage,
});

function FinancePage() {
  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Finance & Expenses"
        description="Monitor daily shop expenses, profit/loss accounts, and accounts payable"
      />
      <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-2xl bg-card/40 text-center select-none">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
          <DollarSign className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-bold text-foreground">Finance Module</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Page coming soon in Sprint 3 Phase 6
        </p>
      </div>
    </PageContainer>
  );
}

export default FinancePage;
