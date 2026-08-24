import { createFileRoute } from "@tanstack/react-router";
import { ProductsPage } from "../features/inventory/pages/products-page";

export const Route = createFileRoute("/app/inventory/products/")({
  component: ProductsPage,
});
