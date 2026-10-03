import * as React from "react";
import type { Metadata } from "next";
import { VmSettings } from "@/components/vms/vm-settings";

interface VmSettingsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: VmSettingsPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `VM ${id} Settings — vmsan`,
    description: `Manage configuration and settings for virtual machine ${id}`,
  };
}

export default async function VmSettingsPage() {
  return <VmSettings />;
}
