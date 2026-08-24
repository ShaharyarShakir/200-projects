import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { DataTable, type DataTableColumn } from "../components/ui/DataTable";
import { StatusBadge } from "../components/ui/StatusBadge";
import { Button } from "../components/ui/button";
import { FilterButton } from "../components/ui/FilterButton";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import { useState } from "react";

export const Route = createFileRoute("/appointments")({
  component: AppointmentsPage,
});

interface AppointmentRow {
  id: string;
  date: string;
  time: string;
  customer: string;
  phone: string;
  service: string;
  barber: string;
  cost: string;
  status: string;
}

function AppointmentsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const mockAppointments: AppointmentRow[] = [
    {
      id: "101",
      date: "2026-08-06",
      time: "09:00 AM",
      customer: "Liam Neeson",
      phone: "+1 555-0199",
      service: "Beard Grooming",
      barber: "Sam Harris",
      cost: "$35.00",
      status: "COMPLETED",
    },
    {
      id: "102",
      date: "2026-08-06",
      time: "10:00 AM",
      customer: "Emma Watson",
      phone: "+1 555-0143",
      service: "Blow Dry & Curl",
      barber: "Elena Rossi",
      cost: "$65.00",
      status: "CONFIRMED",
    },
    {
      id: "103",
      date: "2026-08-06",
      time: "11:30 AM",
      customer: "Christian Bale",
      phone: "+1 555-0182",
      service: "Classic Haircut",
      barber: "Marcus Vance",
      cost: "$40.00",
      status: "CONFIRMED",
    },
    {
      id: "104",
      date: "2026-08-06",
      time: "01:00 PM",
      customer: "Bruce Wayne",
      phone: "+1 555-0100",
      service: "Gentleman Trim",
      barber: "Sam Harris",
      cost: "$50.00",
      status: "PENDING",
    },
    {
      id: "105",
      date: "2026-08-07",
      time: "02:30 PM",
      customer: "Tony Stark",
      phone: "+1 555-3000",
      service: "Full Grooming Combo",
      barber: "Marcus Vance",
      cost: "$90.00",
      status: "PENDING",
    },
  ];

  const columns: DataTableColumn<AppointmentRow>[] = [
    { header: "Date", accessor: "date" },
    {
      header: "Time",
      accessor: (row) => (
        <span className="text-primary font-bold">{row.time}</span>
      ),
    },
    { header: "Customer", accessor: "customer" },
    {
      header: "Contact",
      accessor: (row) => (
        <span className="text-xs text-muted-foreground">{row.phone}</span>
      ),
    },
    { header: "Service", accessor: "service" },
    { header: "Barber", accessor: "barber" },
    {
      header: "Cost",
      accessor: (row) => <span className="font-semibold">{row.cost}</span>,
    },
    {
      header: "Status",
      accessor: (row) => <StatusBadge status={row.status} />,
    },
  ];

  const filteredAppointments = mockAppointments.filter(
    (a) =>
      a.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.service.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <PageContainer>
      <PageHeader
        title="Appointments"
        description="Manage upcoming bookings and schedule barber availability"
        actions={
          <Button
            onClick={() => toast.success("Add Appointment flow coming soon")}
            className="flex items-center gap-1.5 cursor-pointer font-semibold"
          >
            <Plus className="h-4.5 w-4.5" />
            Add Appointment
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={filteredAppointments}
        searchPlaceholder="Search customers or services..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filterComponent={
          <FilterButton onClick={() => toast.success("Filters clicked")} />
        }
        pagination={{
          pageIndex: currentPage,
          pageSize: 5,
          totalItems: filteredAppointments.length,
          onPageChange: setCurrentPage,
        }}
      />
    </PageContainer>
  );
}
export default AppointmentsPage;
