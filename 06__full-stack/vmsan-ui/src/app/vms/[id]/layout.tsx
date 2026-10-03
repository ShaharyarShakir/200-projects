import * as React from "react";
import type { Metadata } from "next";
import { VmConsoleLayoutClient } from "@/components/vms/vm-console-layout-client";

interface VmConsoleLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: VmConsoleLayoutProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `VM ${id} Console — vmsan`,
    description: `Manage virtual machine ${id} configuration, terminal, storage, and networking`,
  };
}

export default async function VmConsoleLayout({
  children,
  params,
}: VmConsoleLayoutProps) {
  const { id } = await params;

  return (
    <VmConsoleLayoutClient id={id}>
      {children}
    </VmConsoleLayoutClient>
  );
}
