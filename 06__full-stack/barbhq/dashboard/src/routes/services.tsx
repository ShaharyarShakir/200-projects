import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { StatusBadge } from "../components/ui/StatusBadge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import { Plus, Edit3, Clock, DollarSign } from "lucide-react";
import toast from "react-hot-toast";

export const Route = createFileRoute("/services")({
  component: ServicesPage,
});

function ServicesPage() {
  const mockServices = [
    {
      id: "1",
      name: "Classic Gentlemen Haircut",
      desc: "Standard scissor and clipper cut suited to your structure. Includes wash, style, and cologne.",
      price: "40.00",
      duration: "30 mins",
      status: "Active",
    },
    {
      id: "2",
      name: "Skin Fade + Lining",
      desc: "High precision fade down to skin with custom hair lining and edge styling.",
      price: "45.00",
      duration: "45 mins",
      status: "Active",
    },
    {
      id: "3",
      name: "Executive Beard Trim & Lineup",
      desc: "Custom beard shaping with hot steam, straight razor detailing, and conditioning beard oils.",
      price: "35.00",
      duration: "30 mins",
      status: "Active",
    },
    {
      id: "4",
      name: "Classic Wet Shave",
      desc: "Old-school straight razor neck and head shave with hot towels and premium lathering cream.",
      price: "50.00",
      duration: "45 mins",
      status: "Active",
    },
    {
      id: "5",
      name: "Charcoal Face Mask & Massage",
      desc: "Deep cleansing pore vacuum and peel-off mud mask, paired with neck shoulder massage.",
      price: "25.00",
      duration: "20 mins",
      status: "Inactive",
    },
    {
      id: "6",
      name: "BarbHQ Gold Combo",
      desc: "VIP treatment: Signature fade, custom beard lineup, steam facial shave, hot towel treatment.",
      price: "95.00",
      duration: "75 mins",
      status: "Active",
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Services"
        description="Configure catalogs, prices, and time windows for grooming treatments"
        actions={
          <Button
            onClick={() => toast.success("Add Service flow coming soon")}
            className="flex items-center gap-1.5 cursor-pointer font-semibold"
          >
            <Plus className="h-4.5 w-4.5" />
            Add Service
          </Button>
        }
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 select-none">
        {mockServices.map((svc) => (
          <Card
            key={svc.id}
            hoverable
            className="flex flex-col justify-between"
          >
            <div>
              <CardHeader className="flex flex-row items-start justify-between pb-3">
                <CardTitle className="text-base font-bold pr-2 font-serif">
                  {svc.name}
                </CardTitle>
                <StatusBadge status={svc.status} />
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {svc.desc}
                </p>
                <div className="flex gap-4 items-center text-xs text-muted-foreground">
                  <div className="flex items-center gap-1 font-semibold">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>{svc.duration}</span>
                  </div>
                  <div className="flex items-center gap-1 font-extrabold text-foreground">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span>${svc.price}</span>
                  </div>
                </div>
              </CardContent>
            </div>

            <div className="px-6 pb-6 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full flex items-center justify-center gap-1.5 cursor-pointer font-semibold"
                onClick={() => toast.success(`Edit ${svc.name} clicked`)}
              >
                <Edit3 className="h-3.5 w-3.5" />
                Configure Service
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}
export default ServicesPage;
