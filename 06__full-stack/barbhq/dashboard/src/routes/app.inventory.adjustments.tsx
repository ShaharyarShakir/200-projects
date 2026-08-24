import { createFileRoute } from "@tanstack/react-router";
import { AdjustmentsPage } from "../features/inventory/pages/adjustments-page";

export const Route = createFileRoute("/app/inventory/adjustments")({
  component: AdjustmentsPage,
});
