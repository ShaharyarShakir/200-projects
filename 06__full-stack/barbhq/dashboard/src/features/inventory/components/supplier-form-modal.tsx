import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2, Truck } from "lucide-react";
import { supplierSchema, type SupplierFormValues } from "../inventory.schemas";
import type { Vendor } from "../inventory.types";
import { Button } from "../../../components/ui/button";

interface SupplierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SupplierFormValues) => void;
  isLoading?: boolean;
  initialData?: Vendor | null;
}

export const SupplierFormModal: React.FC<SupplierFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  initialData = null,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: "",
      contactName: "",
      email: "",
      phone: "",
      address: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || "",
        contactName: initialData.contactName || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        address: initialData.address || "",
      });
    } else {
      reset({
        name: "",
        contactName: "",
        email: "",
        phone: "",
        address: "",
      });
    }
  }, [initialData, isOpen, reset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl text-card-foreground">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {initialData ? "Edit Supplier" : "Add Supplier"}
              </h2>
              <p className="text-xs text-muted-foreground">
                Manage vendor supplier contact information
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Supplier Name *
            </label>
            <input
              {...register("name")}
              placeholder="e.g. ABC Supplies Co."
              className="w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
            />
            {errors.name && (
              <p className="text-xs text-rose-500 mt-1 font-medium">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Contact Person
            </label>
            <input
              {...register("contactName")}
              placeholder="e.g. John Doe (Account Rep)"
              className="w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Phone Number
              </label>
              <input
                {...register("phone")}
                placeholder="0300 1234567"
                className="w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Email Address
              </label>
              <input
                {...register("email")}
                placeholder="sales@abc.com"
                className="w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
              />
              {errors.email && (
                <p className="text-xs text-rose-500 mt-1 font-medium">
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Physical / Business Address
            </label>
            <textarea
              {...register("address")}
              rows={2}
              placeholder="Full warehouse address..."
              className="w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="cursor-pointer font-bold">
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {initialData ? "Save Supplier" : "Add Supplier"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
