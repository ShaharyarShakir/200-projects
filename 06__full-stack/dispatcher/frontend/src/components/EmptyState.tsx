import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, action }) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-4">
      <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 text-slate-400">
        <Inbox className="w-8 h-8" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
        <p className="text-sm text-slate-400 max-w-md mt-1">{description}</p>
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
};
