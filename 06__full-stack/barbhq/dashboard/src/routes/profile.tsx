import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { SectionCard } from "../components/ui/SectionCard";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Avatar } from "../components/ui/avatar";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";
import { format } from "date-fns";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuthStore();

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    toast.error("Profile and password updates are currently unavailable.");
  };

  return (
    <PageContainer>
      <PageHeader
        title="My Profile"
        description="Edit personal credentials, email notifications, and password settings"
      />

      <div className="gap-6 grid lg:grid-cols-3 max-w-5xl select-none">
        {/* Left: Avatar Details card */}
        <div className="lg:col-span-1 h-fit">
          <SectionCard title="Identity Badge">
            <div className="flex flex-col justify-center items-center py-4 text-center animate-fade-in">
              <Avatar
                src={user?.avatar}
                name={user ? `${user.firstName} ${user.lastName}` : ""}
                size="xl"
                className="shadow-lg mb-4 border-2 border-primary/20 animate-scale-in"
              />
              <h3 className="font-serif font-bold text-foreground text-lg">
                {user?.firstName} {user?.lastName}
              </h3>
              <span className="mt-1 font-extrabold text-primary text-xs uppercase tracking-wider">
                {user?.role}
              </span>
              {user?.createdAt ? (
                <p className="mt-3 text-muted-foreground text-xs">
                  Member since {format(new Date(user.createdAt), "MMMM yyyy")}
                </p>
              ) : null}
            </div>
          </SectionCard>
        </div>

        {/* Right: Credentials Form */}
        <form onSubmit={handleUpdate} className="space-y-6 lg:col-span-2">
          <SectionCard
            title="Personal Particulars"
            description="Update your public staff registry info"
          >
            <div className="space-y-4">
              <div className="gap-4 grid sm:grid-cols-2">
                <Input
                  label="First Name"
                  defaultValue={user?.firstName || ""}
                  required
                />
                <Input
                  label="Last Name"
                  defaultValue={user?.lastName || ""}
                  required
                />
              </div>
              <div className="gap-4 grid sm:grid-cols-2">
                <Input
                  label="Email Address"
                  type="email"
                  defaultValue={user?.email || ""}
                  required
                />
                <Input label="Phone Number" defaultValue="+1 555-4089" />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Security Credentials"
            description="Modify account password credentials"
          >
            <div className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                placeholder="••••••••"
              />
              <div className="gap-4 grid sm:grid-cols-2">
                <Input
                  label="New Password"
                  type="password"
                  placeholder="••••••••"
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </SectionCard>

          <div>
            <Button type="submit" className="font-semibold cursor-pointer">
              Update Profile details
            </Button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}
export default ProfilePage;
