import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <div className="bg-red-950/60 border border-red-800/80 rounded-xl p-4 flex items-center justify-between gap-3 text-red-300">
      <div className="flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
        <span className="text-sm font-medium">{message}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs bg-red-900/60 hover:bg-red-800 text-white px-3 py-1.5 rounded-lg transition-all border border-red-700 cursor-pointer shrink-0"
        >
          Retry
        </button>
      )}
    </div>
  );
};
