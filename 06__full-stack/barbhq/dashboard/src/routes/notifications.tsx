import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { Button } from "../components/ui/button";
import { useNotifications } from "../features/notifications/use-notifications";
import { Bell, CheckCheck, Package, Clock, DollarSign, Calendar, ShieldAlert } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotifications();

  const getIcon = (type: string) => {
    switch (type) {
      case "APPOINTMENT":
        return <Calendar className="h-5 w-5 text-primary" />;
      case "INVENTORY":
        return <Package className="h-5 w-5 text-amber-500" />;
      case "ATTENDANCE":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "PAYROLL":
        return <DollarSign className="h-5 w-5 text-emerald-500" />;
      default:
        return <ShieldAlert className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return "recently";
    }
  };

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Notification Center"
        description="System alerts, low inventory notices, and workforce updates"
        actions={
          unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsRead()}
              className="flex items-center gap-1.5 cursor-pointer font-semibold"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all as read
            </Button>
          )
        }
      />

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-2xl bg-card/40 text-center select-none">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
              <Bell className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-foreground">All caught up!</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              You have no active notifications at this time.
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id || n._id}
              onClick={() => !n.isRead && markAsRead(n.id || n._id || "")}
              className={`flex items-start justify-between p-4 rounded-xl border transition-all cursor-pointer select-none ${
                n.isRead
                  ? "bg-card border-border/60 hover:border-border"
                  : "bg-primary/5 border-primary/20 hover:bg-primary/10"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary mt-0.5">
                  {getIcon(n.type)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-foreground">{n.title}</h4>
                    {!n.isRead && (
                      <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase rounded bg-primary text-primary-foreground">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium max-w-xl">
                    {n.message}
                  </p>
                  <span className="inline-block text-[10px] text-muted-foreground font-semibold mt-1">
                    {formatTimeAgo(n.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </PageContainer>
  );
}

export default NotificationsPage;
