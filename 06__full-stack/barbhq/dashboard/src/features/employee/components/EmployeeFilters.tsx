import React, { useEffect, useState } from "react";
import { SearchBar } from "../../../components/ui/SearchBar";
import { NativeSelect, NativeSelectOption } from "../../../components/ui/native-select";
import type { EmployeeFiltersState } from "../types";
import type { EmployeeStatus, EmploymentType } from "../../../types";

interface EmployeeFiltersProps {
  filters: EmployeeFiltersState;
  onFiltersChange: (filters: EmployeeFiltersState) => void;
  showStatusFilter?: boolean;
  showRoleFilter?: boolean;
}

export const EmployeeFilters: React.FC<EmployeeFiltersProps> = ({
  filters,
  onFiltersChange,
  showStatusFilter = true,
  showRoleFilter = true,
}) => {
  const [localSearch, setLocalSearch] = useState(filters.search);

  // Debounce search term local state before bubbling
  const filtersRef = React.useRef(filters);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    const handler = setTimeout(() => {
      onFiltersChange({ ...filtersRef.current, search: localSearch });
    }, 300);

    return () => {
      clearTimeout(handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch]);

  // Handle external search changes
  useEffect(() => {
    setLocalSearch(filters.search);
  }, [filters.search]);

  return (
    <div className="gap-3 grid sm:grid-cols-2 lg:grid-cols-4 bg-card p-4 border border-border/80 rounded-xl w-full">
      {/* 1. Search Bar */}
      <div className="flex flex-col gap-1.5 w-full">
        <label htmlFor="employee-search" className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider select-none">
          Search Staff
        </label>
        <SearchBar
          id="employee-search"
          placeholder="Name, email, phone or code..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="rounded-lg w-full h-9"
        />
      </div>

      {/* 2. Status Filter */}
      {showStatusFilter && (
        <div className="flex flex-col gap-1.5 w-full">
          <label htmlFor="employee-status-filter" className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider select-none">
            Status
          </label>
          <NativeSelect
            id="employee-status-filter"
            value={filters.status}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                status: e.target.value as EmployeeStatus | "ALL",
              })
            }
            className="w-full h-9"
          >
            <NativeSelectOption value="ALL">All Statuses</NativeSelectOption>
            <NativeSelectOption value="ACTIVE">Active</NativeSelectOption>
            <NativeSelectOption value="INACTIVE">Inactive</NativeSelectOption>
            <NativeSelectOption value="SUSPENDED">Suspended</NativeSelectOption>
            <NativeSelectOption value="ON_LEAVE">On Leave</NativeSelectOption>
          </NativeSelect>
        </div>
      )}

      {/* 3. Role Filter */}
      {showRoleFilter && (
        <div className="flex flex-col gap-1.5 w-full">
          <label htmlFor="employee-role-filter" className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider select-none">
            Role
          </label>
          <NativeSelect
            id="employee-role-filter"
            value={filters.role}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                role: e.target.value,
              })
            }
            className="w-full h-9"
          >
            <NativeSelectOption value="ALL">All Roles</NativeSelectOption>
            <NativeSelectOption value="OWNER">Owner</NativeSelectOption>
            <NativeSelectOption value="MANAGER">Manager</NativeSelectOption>
            <NativeSelectOption value="BARBER">Barber</NativeSelectOption>
            <NativeSelectOption value="RECEPTIONIST">Receptionist</NativeSelectOption>
          </NativeSelect>
        </div>
      )}

      {/* 4. Employment Type Filter */}
      <div className="flex flex-col gap-1.5 w-full">
        <label htmlFor="employee-employment-type-filter" className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider select-none">
          Employment Type
        </label>
        <NativeSelect
          id="employee-employment-type-filter"
          value={filters.employmentType}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              employmentType: e.target.value as EmploymentType | "ALL",
            })
          }
          className="w-full h-9"
        >
          <NativeSelectOption value="ALL">All Types</NativeSelectOption>
          <NativeSelectOption value="FULL_TIME">Full Time</NativeSelectOption>
          <NativeSelectOption value="PART_TIME">Part Time</NativeSelectOption>
          <NativeSelectOption value="CONTRACT">Contract</NativeSelectOption>
        </NativeSelect>
      </div>
    </div>
  );
};

export default EmployeeFilters;
