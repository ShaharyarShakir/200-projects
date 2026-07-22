import React, { useState } from 'react';
import { useMap } from 'react-leaflet';
import { ZoomIn, ZoomOut, Maximize2, Minimize2, RotateCcw, RefreshCw, Navigation } from 'lucide-react';

interface MapControlsProps {
  onResetView?: () => void;
  onRecalculate?: () => void;
  onToggleDirections?: () => void;
  showDirectionsToggle?: boolean;
  isDirectionsOpen?: boolean;
}

export const MapControls: React.FC<MapControlsProps> = ({
  onResetView,
  onRecalculate,
  onToggleDirections,
  showDirectionsToggle = true,
  isDirectionsOpen = false,
}) => {
  const map = useMap();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleZoomIn = () => {
    map.zoomIn();
  };

  const handleZoomOut = () => {
    map.zoomOut();
  };

  const handleFullscreenToggle = () => {
    const container = map.getContainer().parentElement;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
      {/* Zoom Controls */}
      <div className="flex flex-col bg-neutral-900/90 backdrop-blur-md border border-neutral-700/60 rounded-xl overflow-hidden shadow-xl text-neutral-200">
        <button
          type="button"
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-2 hover:bg-neutral-800 hover:text-brand-400 transition-colors border-b border-neutral-700/50 cursor-pointer"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-2 hover:bg-neutral-800 hover:text-brand-400 transition-colors cursor-pointer"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>

      {/* View & Recalculate Actions */}
      <div className="flex flex-col bg-neutral-900/90 backdrop-blur-md border border-neutral-700/60 rounded-xl overflow-hidden shadow-xl text-neutral-200">
        {onResetView && (
          <button
            type="button"
            onClick={onResetView}
            title="Reset View"
            className="p-2 hover:bg-neutral-800 hover:text-emerald-400 transition-colors border-b border-neutral-700/50 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          onClick={handleFullscreenToggle}
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          className="p-2 hover:bg-neutral-800 hover:text-amber-400 transition-colors border-b border-neutral-700/50 cursor-pointer"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {onRecalculate && (
          <button
            type="button"
            onClick={onRecalculate}
            title="Recalculate Route"
            className="p-2 hover:bg-neutral-800 hover:text-sky-400 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Directions Toggle */}
      {showDirectionsToggle && onToggleDirections && (
        <button
          type="button"
          onClick={onToggleDirections}
          title="Toggle Directions"
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold shadow-xl border transition-all cursor-pointer ${
            isDirectionsOpen
              ? 'bg-brand-600 text-white border-brand-500 hover:bg-brand-500'
              : 'bg-neutral-900/90 backdrop-blur-md text-neutral-200 border-neutral-700/60 hover:bg-neutral-800 hover:text-brand-400'
          }`}
        >
          <Navigation className="w-4 h-4" />
          <span>Directions</span>
        </button>
      )}
    </div>
  );
};
