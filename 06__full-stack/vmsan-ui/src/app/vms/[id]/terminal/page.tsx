import * as React from "react";
import type { Metadata } from "next";
import { VmTerminal } from "@/components/vms/vm-terminal";

interface VmTerminalPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: VmTerminalPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `VM ${id} Terminal — vmsan`,
    description: `Interactive terminal for virtual machine ${id}`,
  };
}

export default async function VmTerminalPage({ params }: VmTerminalPageProps) {
  const { id } = await params;
  return <VmTerminal vmId={id} />;
}
