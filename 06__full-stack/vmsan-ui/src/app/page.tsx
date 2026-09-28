import { VMDashboard } from "@/components/vms/vm-dashboard";

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <VMDashboard />
      </div>
    </main>
  );
}
