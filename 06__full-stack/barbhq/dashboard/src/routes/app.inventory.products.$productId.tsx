import { createFileRoute } from "@tanstack/react-router";
import { ProductDetailsPage } from "../features/inventory/pages/product-details-page";

export const Route = createFileRoute("/app/inventory/products/$productId")({
  component: ProductDetailsPage,
});
