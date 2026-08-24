import { createFileRoute } from "@tanstack/react-router";
import { PurchasesPage } from "../features/inventory/pages/purchases-page";

export const Route = createFileRoute("/app/inventory/purchases")({
  component: PurchasesPage,
});
