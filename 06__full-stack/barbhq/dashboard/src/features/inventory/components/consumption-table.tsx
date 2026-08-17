import React from "react";
import { TrendingDown } from "lucide-react";
import type { StockMovement } from "../inventory.types";

interface ConsumptionTableProps {
  consumptionLogs: StockMovement[];
  title?: string;
}

export const ConsumptionTable: React.FC<ConsumptionTableProps> = ({
  consumptionLogs,
  title = "Stock Consumption Log",
}) => {
  if (consumptionLogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-border bg-card">
        <TrendingDown className="h-10 w-10 text-muted-foreground/40 mb-2" />
        <p className="text-sm font-medium">No Consumption Recorded Today</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Record products used during customer services or shop operations.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
      {title && (
        <div className="p-4 border-b border-border font-bold text-sm bg-muted/30">
          {title}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 border-b border-border text-xs uppercase font-bold text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Time / Date</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3 text-right">Quantity Consumed</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {consumptionLogs.map((log) => {
              const formattedDate = log.createdAt
                ? new Date(log.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Today";

              return (
                <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-xs text-muted-foreground font-medium">
                    {formattedDate}
                  </td>
                  <td className="px-4 py-3 font-bold text-foreground">
                    {log.itemName || "Product Item"}
                  </td>
                  <td className="px-4 py-3 text-right font-extrabold text-rose-500">
                    -{Math.abs(log.quantity)} units
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      {log.reason || "Services"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {log.notes || "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
