import { createRootRoute, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { useThemeStore } from "../store/themeStore";
import AuthLayout from "../layouts/AuthLayout";
import DashboardLayout from "../layouts/DashboardLayout";
import { AuthGuard } from "../features/auth";
import { Toaster } from "react-hot-toast";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  console.count("RootComponent Render");
  const { theme } = useThemeStore();
  const location = useLocation();

  const isHomePage =
    location.pathname === "/" || location.pathname === "";

  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/login/" ||
    location.pathname === "/signup" ||
    location.pathname === "/signup/";

  // Theme Sync effect
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    const applyTheme = (selectedTheme: string) => {
      root.classList.remove("light", "dark");
      root.classList.add(selectedTheme);
    };

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const updateSystemTheme = () => {
        applyTheme(mediaQuery.matches ? "dark" : "light");
      };

      updateSystemTheme();
      mediaQuery.addEventListener("change", updateSystemTheme);
      return () => mediaQuery.removeEventListener("change", updateSystemTheme);
    }

    applyTheme(theme);
  }, [theme]);

  return (
    <>
      {isHomePage ? (
        <Outlet />
      ) : isAuthPage ? (
        <AuthLayout>
          <Outlet />
        </AuthLayout>
      ) : (
        <AuthGuard>
          <DashboardLayout>
            <Outlet />
          </DashboardLayout>
        </AuthGuard>
      )}

      <Toaster
        position="top-right"
        toastOptions={{
          className:
            "dark:bg-card dark:text-foreground border dark:border-border text-sm font-semibold rounded-xl px-4.5 py-3 shadow-xl",
          duration: 3500,
        }}
      />
    </>
  );
}
