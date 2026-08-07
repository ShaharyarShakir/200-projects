import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { SectionCard } from "../components/ui/SectionCard";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useThemeStore } from "../store/themeStore";
import toast from "react-hot-toast";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, setTheme } = useThemeStore();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Shop settings saved successfully!");
  };

  return (
    <PageContainer>
      <PageHeader
        title="Settings"
        description="Configure business metadata, currency preferences, and interface appearance"
      />

      <form onSubmit={handleSave} className="grid gap-6 max-w-3xl select-none">
        <SectionCard
          title="Shop Information"
          description="Main public profiles for your barbershop"
        >
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Shop Name"
                defaultValue="BarbHQ Signature Salon"
                required
              />
              <Input
                label="Support Phone"
                defaultValue="+1 555-9000"
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Public Email"
                type="email"
                defaultValue="bookings@barbhq.com"
                required
              />
              <Input label="Website URL" defaultValue="https://barbhq.com" />
            </div>
            <Input
              label="Physical Address"
              defaultValue="104 Luxury Lane, Suite B, Beverly Hills, CA"
              required
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Preferences"
          description="Tweak local parameters and interface aesthetics"
        >
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Local Currency Symbol" defaultValue="$" />
              <Input
                label="Timezone"
                defaultValue="America/Los_Angeles"
                disabled
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Dashboard Appearance
              </label>
              <div className="flex gap-2 max-w-sm">
                <Button
                  type="button"
                  variant={theme === "light" ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setTheme("light")}
                  className="flex-1 cursor-pointer font-semibold"
                >
                  Light
                </Button>
                <Button
                  type="button"
                  variant={theme === "dark" ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setTheme("dark")}
                  className="flex-1 cursor-pointer font-semibold"
                >
                  Dark
                </Button>
                <Button
                  type="button"
                  variant={theme === "system" ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setTheme("system")}
                  className="flex-1 cursor-pointer font-semibold"
                >
                  System
                </Button>
              </div>
            </div>
          </div>
        </SectionCard>

        <div>
          <Button type="submit" className="cursor-pointer font-semibold">
            Save All Configurations
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
export default SettingsPage;
