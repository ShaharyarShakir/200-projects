import { Navigate } from "react-router-dom";

import { Button } from "../components/ui/Button";
import {
  Calendar,
  Dumbbell,
  RefreshCcw,
  Target,
  TrendingUp,
} from "lucide-react";
import { Card } from "../components/ui/Card";
import { PlanDisplay } from "../components/plan/PlanDisplay";
import { useAuth } from "../hooks/useAuth";

export default function Profile() {
  const { user, isLoading, plan, generatePlan } = useAuth()

  if (!user && !isLoading) {
    return <Navigate to="/auth/sign-in" replace />;
  }

  if (!plan) {
    return <Navigate to="/onboarding" replace />;
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="px-6 pt-24 pb-12 min-h-screen">
      <div className="mx-auto max-w-4xl">
        <div className="flex md:flex-row flex-col justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="mb-1 font-bold text-3xl">Your Training Plan</h1>
            <p className="text-muted">
              Version {plan.version} • Created {formatDate(plan.createdAt)}
            </p>
          </div>

          <Button
            variant="secondary"
            className="gap-2"
            onClick={async () => await generatePlan()}
          >
            <RefreshCcw className="w-4 h-4" />
            Regenerate Plan
          </Button>
        </div>

        <div className="gap-4 grid md:grid-cols-4 mb-8">
          <Card variant="bordered" className="flex items-center gap-3">
            <div className="flex justify-center items-center w-10 h-10">
              <Target className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-muted text-xs">Goal</p>
              <p className="font-medium text-sm">{plan.overview.goal}</p>
            </div>
          </Card>
          <Card variant="bordered" className="flex items-center gap-3">
            <div className="flex justify-center items-center w-10 h-10">
              <Calendar className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-muted text-xs">Frequency</p>
              <p className="font-medium text-sm">{plan.overview.frequency}</p>
            </div>
          </Card>
          <Card variant="bordered" className="flex items-center gap-3">
            <div className="flex justify-center items-center w-10 h-10">
              <Dumbbell className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-muted text-xs">Split</p>
              <p className="font-medium text-sm">{plan.overview.split}</p>
            </div>
          </Card>
          <Card variant="bordered" className="flex items-center gap-3">
            <div className="flex justify-center items-center w-10 h-10">
              <TrendingUp className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-muted text-xs">Version</p>
              <p className="font-medium text-sm">{plan.version}</p>
            </div>
          </Card>
        </div>

        {/* Plan notes */}
        <Card variant="bordered" className="mb-8">
          <h2 className="mb-2 font-semibold text-lg">Program Notes</h2>
          <p className="text-muted text-sm leading-relaxed">
            {plan.overview.notes}
          </p>
        </Card>

        {/* Weekly Schedule */}
        <h2 className="mb-4 font-semibold text-xl">Weekly Schedule</h2>
        <PlanDisplay weeklySchedule={plan.weeklySchedule} />

        <Card variant="bordered" className="mb-8">
          <h2 className="mb-2 font-semibold text-lg">Progression Strategy</h2>
          <p className="text-muted text-sm leading-relaxed">
            {plan.progression}
          </p>
        </Card>
      </div>
    </div>
  );
}