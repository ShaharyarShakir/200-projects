"use client";

import * as React from "react";
import type {
  ClientVM,
  ExecuteVmCommandRequest,
  ExecuteVmCommandResult,
} from "@/lib/api/types";

export interface VmConsoleContextValue {
  vm: ClientVM;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  deleteVm: () => Promise<void>;
  executeCommand: (
    options: ExecuteVmCommandRequest
  ) => Promise<ExecuteVmCommandResult>;
}

export const VmConsoleContext = React.createContext<VmConsoleContextValue | null>(
  null
);

export function useOptionalVmConsole(): VmConsoleContextValue | null {
  return React.useContext(VmConsoleContext);
}

export function useVmConsole(): VmConsoleContextValue {
  const context = React.useContext(VmConsoleContext);
  if (!context) {
    throw new Error("useVmConsole must be used within a VmConsoleProvider");
  }
  return context;
}
