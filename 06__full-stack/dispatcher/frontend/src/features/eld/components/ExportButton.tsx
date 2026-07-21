import React, { useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { eldApi } from '../api/eldApi';

interface ExportButtonProps {
  tripId?: string | null;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ tripId }) => {
  const [isExporting, setIsExporting] = useState(false);

  const effectiveTripId = tripId || 'sample';
  const pdfUrl = eldApi.getPDFDownloadUrl(effectiveTripId);

  const handleDownloadPDF = async () => {
    setIsExporting(true);
    try {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.target = '_blank';
      link.download = `fmcsa_daily_logs_${effectiveTripId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.open(pdfUrl, '_blank');
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleDownloadPDF}
        disabled={isExporting}
        className="bg-brand-600 hover:bg-brand-700 text-neutral-0 font-semibold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-brand-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
      >
        {isExporting ? (
          <>
            <div className="w-3.5 h-3.5 border-2 border-neutral-0 border-t-transparent rounded-full animate-spin"></div>
            <span>Exporting PDF...</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            <span>Export PDF</span>
          </>
        )}
      </button>

      <button
        onClick={handlePrint}
        className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-semibold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
      >
        <Printer className="w-4 h-4 text-neutral-400" />
        <span>Print Logs</span>
      </button>
    </div>
  );
};
