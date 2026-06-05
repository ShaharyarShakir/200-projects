import DashboardContent from "@/components/dashboard-content";
import { getSession } from "@/lib/auth/server";
import React from "react";

export default async function DashboardPage() {
  const session = await getSession();
  return <DashboardContent userId={session.data?.user.id} />;
}
