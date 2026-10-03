import * as React from "react";
import type { Metadata } from "next";
import { VmNetworking } from "@/components/vms/vm-networking";

interface VmNetworkingPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: VmNetworkingPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `VM ${id} Networking — vmsan`,
    description: `Network configuration and interfaces for virtual machine ${id}`,
  };
}

export default async function VmNetworkingPage() {
  return <VmNetworking />;
}
