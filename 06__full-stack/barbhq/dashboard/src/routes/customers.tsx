import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { DataTable, type DataTableColumn } from "../components/ui/DataTable";
import { Button } from "../components/ui/button";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import { useState } from "react";

export const Route = createFileRoute("/customers")({
  component: CustomersPage,
});

interface CustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  visits: number;
  lastVisit: string;
  notes: string;
}

function CustomersPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const mockCustomers: CustomerRow[] = [
    {
      id: "1",
      name: "John Doe",
      email: "john.doe@gmail.com",
      phone: "+1 555-0192",
      visits: 14,
      lastVisit: "2026-08-01",
      notes: "Prefers scissors cut on top, gel styling.",
    },
    {
      id: "2",
      name: "Liam Neeson",
      email: "liam@neeson.com",
      phone: "+1 555-0199",
      visits: 8,
      lastVisit: "2026-08-06",
      notes: "Beard trim client, loves hot towels.",
    },
    {
      id: "3",
      name: "Emma Watson",
      email: "emma@watson.co.uk",
      phone: "+1 555-0143",
      visits: 22,
      lastVisit: "2026-08-06",
      notes: "Styling appointments only.",
    },
    {
      id: "4",
      name: "Christian Bale",
      email: "christian.b@bale.com",
      phone: "+1 555-0182",
      visits: 5,
      lastVisit: "2026-08-06",
      notes: "Skin fade specialist preference.",
    },
    {
      id: "5",
      name: "Bruce Wayne",
      email: "bruce@waynecorp.com",
      phone: "+1 555-0100",
      visits: 31,
      lastVisit: "2026-08-06",
      notes: "VVIP, prefers sam for express trim.",
    },
  ];

  const columns: DataTableColumn<CustomerRow>[] = [
    { header: "Customer Name", accessor: "name", className: "font-semibold" },
    { header: "Email", accessor: "email", className: "text-muted-foreground" },
    { header: "Phone Number", accessor: "phone" },
    {
      header: "Total Visits",
      accessor: (row) => (
        <span className="font-bold text-primary">{row.visits}</span>
      ),
      className: "text-center",
    },
    { header: "Last Visit", accessor: "lastVisit" },
    {
      header: "Notes",
      accessor: (row) => (
        <span className="text-xs text-muted-foreground truncate max-w-xs block">
          {row.notes}
        </span>
      ),
    },
  ];

  const filteredCustomers = mockCustomers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm),
  );

  return (
    <PageContainer>
      <PageHeader
        title="Customers"
        description="Maintain visitor records, history notes, and contact schedules"
        actions={
          <Button
            onClick={() => toast.success("Add Customer flow coming soon")}
            className="flex items-center gap-1.5 cursor-pointer font-semibold"
          >
            <Plus className="h-4.5 w-4.5" />
            Add Customer
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={filteredCustomers}
        searchPlaceholder="Search by name, email, phone..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        pagination={{
          pageIndex: currentPage,
          pageSize: 5,
          totalItems: filteredCustomers.length,
          onPageChange: setCurrentPage,
        }}
      />
    </PageContainer>
  );
}
export default CustomersPage;
