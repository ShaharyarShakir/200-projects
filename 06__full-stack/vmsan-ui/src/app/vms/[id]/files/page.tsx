import * as React from "react";
import type { Metadata } from "next";
import { VmFileBrowser } from "@/components/vms/vm-file-browser";

interface VmFilesPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: VmFilesPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `VM ${id} Files — vmsan`,
    description: `Browse and manage files inside virtual machine ${id}`,
  };
}

export default async function VmFilesPage() {
  return <VmFileBrowser />;
}
