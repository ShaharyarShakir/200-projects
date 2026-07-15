import { useEffect, useState } from "react";
import * as Y from "yjs";
import { CanvasEngine } from "../core";

export function useCanvas(ydoc: Y.Doc | null): CanvasEngine | null {
  const [engine, setEngine] = useState<CanvasEngine | null>(null);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (!ydoc) {
      setEngine(null);
      return;
    }

    const newEngine = new CanvasEngine(ydoc);
    setEngine(newEngine);

    // Force React to re-render when engine state updates
    const unsubscribe = newEngine.subscribe(() => {
      forceUpdate((tick) => tick + 1);
    });

    return () => {
      unsubscribe();
      newEngine.destroy();
    };
  }, [ydoc]);

  return engine;
}
export default useCanvas;
