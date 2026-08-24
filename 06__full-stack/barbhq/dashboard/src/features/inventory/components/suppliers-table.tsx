import React from "react";
import { Truck, Edit2, Trash2, Mail, Phone } from "lucide-react";
import type { Vendor } from "../inventory.types";

interface SuppliersTableProps {
  suppliers: Vendor[];
  onEditSupplier: (supplier: Vendor) => void;
  onDeleteSupplier: (id: string) => void;
}

export const SuppliersTable: React.FC<SuppliersTableProps> = ({
  suppliers,
  onEditSupplier,
  onDeleteSupplier,
}) => {
  if (suppliers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center rounded-xl border border-border bg-card">
        <Truck className="h-10 w-10 text-muted-foreground/40 mb-2" />
        <h3 className="text-base font-bold">No Suppliers Registered</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Add suppliers and vendors to manage stock supply chains and purchase orders.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 border-b border-border text-xs uppercase font-bold text-muted-foreground">
            <tr>
              <th className="px-4 py-3.5">Supplier Name</th>
              <th className="px-4 py-3.5">Contact Person</th>
              <th className="px-4 py-3.5">Phone / Email</th>
              <th className="px-4 py-3.5">Address</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {suppliers.map((supplier) => (
              <tr key={supplier.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3.5">
                  <span className="font-bold text-foreground block">{supplier.name}</span>
                </td>

                <td className="px-4 py-3.5 text-foreground font-medium">
                  {supplier.contactName || "—"}
                </td>

                <td className="px-4 py-3.5">
                  <div className="space-y-0.5 text-xs text-muted-foreground">
                    {supplier.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span>{supplier.phone}</span>
                      </div>
                    )}
                    {supplier.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span>{supplier.email}</span>
                      </div>
                    )}
                    {!supplier.phone && !supplier.email && "—"}
                  </div>
                </td>

                <td className="px-4 py-3.5 text-xs text-muted-foreground max-w-xs truncate">
                  {supplier.address || "—"}
                </td>

                <td className="px-4 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEditSupplier(supplier)}
                      title="Edit Supplier"
                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete supplier "${supplier.name}"?`)) {
                          onDeleteSupplier(supplier.id);
                        }
                      }}
                      title="Delete Supplier"
                      className="p-1.5 rounded-md hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
