import * as React from "react";
import type { Metadata } from "next";
import { VmStorage } from "@/components/vms/vm-storage";

interface VmStoragePageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: VmStoragePageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `VM ${id} Storage — vmsan`,
    description: `Storage configuration and volumes for virtual machine ${id}`,
  };
}

export default async function VmStoragePage() {
  return <VmStorage />;
}
