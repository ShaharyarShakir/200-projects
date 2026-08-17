import React, { useState, useEffect } from "react";
import { Search, Filter, RotateCcw } from "lucide-react";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";

export interface EmployeeFiltersState {
  search: string;
  role: string;
  status: string;
  employmentType?: string;
}

interface EmployeeFiltersProps {
  filters: EmployeeFiltersState;
  onFiltersChange: (newFilters: EmployeeFiltersState) => void;
}

export const EmployeeFilters: React.FC<EmployeeFiltersProps> = ({
  filters,
  onFiltersChange,
}) => {
  const [searchTerm, setSearchTerm] = useState(filters.search || "");

  // Debounce search input changes by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== filters.search) {
        onFiltersChange({ ...filters, search: searchTerm });
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm, filters, onFiltersChange]);

  // Sync external filter changes to local state
  useEffect(() => {
    setSearchTerm(filters.search || "");
  }, [filters.search]);

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({ ...filters, role: e.target.value });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({ ...filters, status: e.target.value });
  };

  const handleReset = () => {
    setSearchTerm("");
    onFiltersChange({
      search: "",
      role: "ALL",
      status: "ALL",
      employmentType: "ALL",
    });
  };

  const isFiltered =
    !!filters.search ||
    (filters.role && filters.role !== "ALL") ||
    (filters.status && filters.status !== "ALL");

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border shadow-xs select-none">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by name, email, phone, or code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 text-xs h-10 bg-background"
        />
      </div>

      {/* Filter Select Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Role Select */}
        <div className="relative flex items-center">
          <Filter className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <select
            value={filters.role || "ALL"}
            onChange={handleRoleChange}
            className="pl-8 pr-7 py-2 text-xs font-semibold rounded-lg border border-border bg-background text-foreground hover:bg-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer appearance-none"
          >
            <option value="ALL">All Roles</option>
            <option value="OWNER">Owner</option>
            <option value="MANAGER">Manager</option>
            <option value="RECEPTIONIST">Receptionist</option>
            <option value="BARBER">Barber</option>
          </select>
        </div>

        {/* Status Select */}
        <select
          value={filters.status || "ALL"}
          onChange={handleStatusChange}
          className="px-3 py-2 text-xs font-semibold rounded-lg border border-border bg-background text-foreground hover:bg-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer appearance-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>

        {/* Reset Action Button */}
        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer h-9 px-2.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
};
