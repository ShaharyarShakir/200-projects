import React from "react";
import { Activity, Database, HardDrive, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "../../../lib/component/ui/Card";

export default function ClusterStatusGrid({ pingStatus, pingData, pingError, user }) {
  return (
    <div className="gap-6 grid grid-cols-1 md:grid-cols-3">
      {/* Gateway Connection Card */}
      <Card className="flex flex-col justify-between bg-white dark:bg-[#0b0f0e]/40 shadow-sm p-6 border-slate-200 dark:border-slate-850">
        <CardHeader className="flex-row justify-between items-center space-y-0 mb-4 p-0">
          <span className="font-semibold text-slate-500 dark:text-slate-400 text-sm">
            Cluster Connection
          </span>
          <Activity className="w-5 h-5 text-teal-600 dark:text-teal-400 animate-pulse" />
        </CardHeader>
        <CardContent className="flex flex-col justify-between p-0 h-full">
          <div className="flex items-center gap-3">
            {pingStatus === "pending" && (
              <>
                <div className="bg-yellow-500 rounded-full w-3.5 h-3.5 animate-pulse" />
                <span className="font-bold text-yellow-600 dark:text-yellow-500 text-lg">
                  Connecting...
                </span>
              </>
            )}
            {pingStatus === "success" && (
              <>
                <div className="bg-emerald-500 shadow-emerald-500/30 shadow-md rounded-full w-3.5 h-3.5" />
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg flex items-center gap-1">
                  Active <CheckCircle2 className="w-4 h-4 text-emerald-500 inline-block" />
                </span>
              </>
            )}
            {pingStatus === "error" && (
              <>
                <div className="bg-rose-500 shadow-md shadow-rose-500/30 rounded-full w-3.5 h-3.5" />
                <span className="font-bold text-rose-600 dark:text-rose-400 text-lg flex items-center gap-1">
                  Offline <XCircle className="w-4 h-4 text-rose-500 inline-block" />
                </span>
              </>
            )}
          </div>
          <div className="mt-4 font-mono text-[11px] text-slate-400 dark:text-slate-500 truncate">
            {pingStatus === "success"
              ? `Node: "${pingData?.message || "Garage"}"`
              : pingError
                ? `Error: Connection lost`
                : "Locating gateway..."}
          </div>
        </CardContent>
      </Card>

      {/* MongoDB Node Card */}
      <Card className="flex flex-col justify-between bg-white dark:bg-[#0b0f0e]/40 shadow-sm p-6 border-slate-200 dark:border-slate-855">
        <CardHeader className="flex-row justify-between items-center space-y-0 mb-4 p-0">
          <span className="font-semibold text-slate-500 dark:text-slate-400 text-sm">
            Metadata Store (MongoDB)
          </span>
          <Database className="w-5 h-5 text-teal-500 dark:text-teal-400" />
        </CardHeader>
        <CardContent className="flex flex-col justify-between p-0 h-full">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 shadow-emerald-500/30 shadow-md rounded-full w-3.5 h-3.5" />
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">
              Sync Active
            </span>
          </div>
          <div className="mt-4 font-mono text-[11px] text-slate-400 dark:text-slate-500 truncate">
            ID: {user?.email}
          </div>
        </CardContent>
      </Card>

      {/* Garage Storage Node Card */}
      <Card className="flex flex-col justify-between bg-white dark:bg-[#0b0f0e]/40 shadow-sm p-6 border-slate-200 dark:border-slate-855">
        <CardHeader className="flex-row justify-between items-center space-y-0 mb-4 p-0">
          <span className="font-semibold text-slate-500 dark:text-slate-400 text-sm">
            Object Node (Garage S3)
          </span>
          <HardDrive className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
        </CardHeader>
        <CardContent className="flex flex-col justify-between p-0 h-full">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 shadow-emerald-500/30 shadow-md rounded-full w-3.5 h-3.5" />
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">Ready</span>
          </div>
          <div className="mt-4 font-mono text-[11px] text-slate-400 dark:text-slate-500 truncate">
            Bucket: nimbus-drive
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
