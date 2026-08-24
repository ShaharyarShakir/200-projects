import { createFileRoute } from "@tanstack/react-router";
import { InventoryOverviewPage } from "../features/inventory/pages/inventory-overview-page";

export const Route = createFileRoute("/app/inventory/")({
  component: InventoryOverviewPage,
});
