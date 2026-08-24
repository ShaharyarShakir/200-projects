import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { EmptyState } from "../components/ui/EmptyState";
import { ShoppingBag, Plus } from "lucide-react";
import { Button } from "../components/ui/button";
import toast from "react-hot-toast";

export const Route = createFileRoute("/products")({
  component: ProductsPage,
});

function ProductsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Products"
        description="Manage your salon's retail items and merchandise"
        actions={
          <Button
            onClick={() => toast.success("Add product flow coming soon")}
            className="flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" />
            Add Product
          </Button>
        }
      />
      <EmptyState
        title="No products found"
        description="Add products to start tracking and selling salon retail merchandise."
        icon={<ShoppingBag className="h-10 w-10 text-muted-foreground" />}
        actionText="Add Product"
        onAction={() => toast.success("Add product flow coming soon")}
      />
    </PageContainer>
  );
}
export default ProductsPage;
