import React from "react";
import { Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../lib/component/ui/Card";

export default function About() {
  return (
    <Card className="max-w-2xl mx-auto p-8">
      <CardHeader className="flex-row items-center gap-3 p-0 mb-6">
        <Info className="w-6 h-6 text-teal-400" />
        <CardTitle className="text-2xl font-bold text-white">About Nimbus Drive</CardTitle>
      </CardHeader>
      <CardContent className="p-0 space-y-6">
        <p className="text-slate-300 leading-relaxed font-light">
          Nimbus Drive is a full-stack monorepo web storage client. Built for Sprint 1, this
          environment runs using a Bun monorepo setup running MongoDB and Garage S3 Object storage
          within a cluster.
        </p>
        <div className="border-t border-slate-800/60 pt-6 space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-teal-400">
            Architecture Components
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-slate-800/40 border border-slate-700/30 rounded-lg">
              <div className="font-bold text-white">Frontend</div>
              <div className="text-xs text-slate-400 mt-1">React + TanStack</div>
            </div>
            <div className="p-3 bg-slate-800/40 border border-slate-700/30 rounded-lg">
              <div className="font-bold text-white">Backend</div>
              <div className="text-xs text-slate-400 mt-1">Express API</div>
            </div>
            <div className="p-3 bg-slate-800/40 border border-slate-700/30 rounded-lg">
              <div className="font-bold text-white">Database</div>
              <div className="text-xs text-slate-400 mt-1">MongoDB</div>
            </div>
            <div className="p-3 bg-slate-800/40 border border-slate-700/30 rounded-lg">
              <div className="font-bold text-white">Object Storage</div>
              <div className="text-xs text-slate-400 mt-1">Garage S3 API</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
