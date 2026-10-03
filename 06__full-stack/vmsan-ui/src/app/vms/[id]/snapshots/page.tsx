import * as React from "react";
import type { Metadata } from "next";
import { VmSnapshots } from "@/components/vms/vm-snapshots";

interface VmSnapshotsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: VmSnapshotsPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `VM ${id} Snapshots — vmsan`,
    description: `Snapshot and state restore controls for virtual machine ${id}`,
  };
}

export default async function VmSnapshotsPage() {
  return <VmSnapshots />;
}
