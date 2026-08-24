import { createFileRoute } from "@tanstack/react-router";
import { ConsumptionPage } from "../features/inventory/pages/consumption-page";

export const Route = createFileRoute("/app/inventory/consumption")({
  component: ConsumptionPage,
});
