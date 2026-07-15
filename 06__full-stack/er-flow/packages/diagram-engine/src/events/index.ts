import { CanvasEngine } from "../core";

let isSpacePressed = false;
let previousToolId: string | null = null;

export function registerGlobalShortcuts(engine: CanvasEngine): () => void {
  const handleKeyDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    // Don't trigger shortcuts if typing in input elements
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable
    ) {
      return;
    }

    const isCtrlOrCmd = e.ctrlKey || e.metaKey;
    const key = e.key.toLowerCase();

    // 1. Spacebar temporary pan tool switch
    if (e.code === "Space" && !isSpacePressed) {
      isSpacePressed = true;
      e.preventDefault();
      if (engine.activeTool?.id !== "hand") {
        previousToolId = engine.activeTool?.id || "select";
        engine.setActiveTool("hand");
      }
    }

    // 2. Delete / Backspace to remove shapes
    if (key === "delete" || key === "backspace") {
      e.preventDefault();
      engine.deleteSelectedShapes();
    }

    // 3. Escape to deselect
    if (key === "escape") {
      e.preventDefault();
      engine.clearSelection();
    }

    // 4. Undo / Redo
    if (isCtrlOrCmd && key === "z") {
      e.preventDefault();
      if (e.shiftKey) {
        engine.redo();
      } else {
        engine.undo();
      }
    }

    if (isCtrlOrCmd && key === "y") {
      e.preventDefault();
      engine.redo();
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.code === "Space" && isSpacePressed) {
      isSpacePressed = false;
      e.preventDefault();
      if (previousToolId) {
        engine.setActiveTool(previousToolId);
        previousToolId = null;
      }
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);

  return () => {
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
  };
}
