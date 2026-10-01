import * as React from "react";
import type { Metadata } from "next";
import { VmDetailView } from "@/components/vms/vm-detail-view";

interface VmDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: VmDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `VM ${id} — vmsan`,
    description: `Inspect virtual machine ${id} specifications and runtime state`,
  };
}

export default async function VmDetailPage({ params }: VmDetailPageProps) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <VmDetailView id={id} />
      </div>
    </main>
  );
}
