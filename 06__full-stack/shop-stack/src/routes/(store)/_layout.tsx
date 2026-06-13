import Header from "#/components/base/common/header";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/(store)/_layout")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <Header />
      <Outlet />
    </>
  );
}
