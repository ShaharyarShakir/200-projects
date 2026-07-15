import * as Y from "yjs";

export class HistoryManager {
  private undoManager: Y.UndoManager;

  constructor(targetMap: Y.Map<any>) {
    this.undoManager = new Y.UndoManager(targetMap, {
      captureTimeout: 500, // Merges edits within 500ms into a single undo step
    });
  }

  undo(): void {
    if (this.canUndo()) {
      this.undoManager.undo();
    }
  }

  redo(): void {
    if (this.canRedo()) {
      this.undoManager.redo();
    }
  }

  canUndo(): boolean {
    return this.undoManager.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.undoManager.redoStack.length > 0;
  }
}
