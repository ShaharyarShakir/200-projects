import React from 'react';
import { Activity, Shield } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-50/60 mt-auto py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-brand-600" />
          <span>&copy; {new Date().getFullYear()} Dispatcher Trip Planner Engine. All rights reserved.</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-success-600 font-medium">
            <Activity className="w-3.5 h-3.5" /> Backend API Connected
          </span>
          <span className="text-neutral-300">|</span>
          <span className="hover:text-neutral-800 cursor-pointer transition-colors">Privacy Policy</span>
          <span className="hover:text-neutral-800 cursor-pointer transition-colors">Terms of Service</span>
        </div>
      </div>
    </footer>
  );
};
