import { Dumbbell, Info } from "lucide-react";
import type { DaySchedule, Exercise } from "../../types";
import { Card } from "../ui/Card";

function ExerciseRow({
  exercise,
  index,
}: {
  exercise: Exercise;
  index: number;
}) {
  return (
    <tr className="border-border last:border-0 border-b">
      <td className="py-3 pr-4">
        <div className="flex items-start gap-3">
          <span className="w-5 text-muted text-xs">
            {index + 1}.
          </span>
          <div>
            <p className="font-medium">{exercise.name}</p>
            {exercise.notes && (
              <p className="flex items-center gap-1 mt-0.5 text-muted text-xs">
                <Info className="w-3 h-3" />
                {exercise.notes}
              </p>
            )}
          </div>
        </div>
      </td>

      <td className="px-4 py-3 text-center whitespace-nowrap">
        <span className="font-medium text-accent">
          {exercise.sets}
        </span>
        <span className="text-muted"> x </span>
        <span>{exercise.reps}</span>
      </td>

      <td className="px-4 py-3 text-center">
        <span className="text-muted">{exercise.rest}</span>
      </td>
      <td className="px-4 py-3 text-center">
        <span
          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium 
            ${
              exercise.rpe >= 8
                ? `bg-red-500/10 text-red-400`
                : exercise.rpe >= 7
                  ? "bg-yellow-500/10 text-yellow-400"
                  : "bg-green-500/10 text-green-400"
            }`}
        >
          {exercise.rpe}
        </span>
      </td>
    </tr>
  );
}

function DayCard({ schedule }: { schedule: DaySchedule }) {
  return (
    <Card variant="bordered" className="overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-semibold text-lg">{schedule.day}</h3>
          <p className="text-accent text-sm">{schedule.focus}</p>
        </div>
        <div className="flex items-center gap-2 text-muted text-sm">
          <Dumbbell className="w-4 h-4" />
          <span>{schedule.exercises.length} exercises</span>
        </div>
      </div>

      <div className="-mx-6 px-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted text-xs uppercase tracking-wider">
              <th className="py-2 pr-4 font-medium text-left">Excercise</th>
              <th className="px-4 py-2 font-medium">Sets x Reps</th>
              <th className="px-4 py-2 font-medium">Rest</th>
              <th className="px-4 py-2 font-medium">RPE</th>
            </tr>
          </thead>

          <tbody>
            {schedule.exercises.map((exercise, key) => (
              <ExerciseRow exercise={exercise} index={key} />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

interface PlanDisplayProps {
  weeklySchedule: DaySchedule[];
}

export function PlanDisplay({ weeklySchedule }: PlanDisplayProps) {
  return (
    <div className="space-y-6 mb-8">
      {weeklySchedule.map((schedule, key) => (
        <DayCard key={key} schedule={schedule} />
      ))}
    </div>
  );
}