import { createFileRoute } from "@tanstack/react-router";
import { SuppliersPage } from "../features/inventory/pages/suppliers-page";

export const Route = createFileRoute("/app/inventory/suppliers")({
  component: SuppliersPage,
});
