import { DownloadItem } from "./download.types";

class DownloadStore {
  private downloads = new Map<string, DownloadItem>();

  // NEW: process map
  private processes = new Map<string, any>();

  addProcess(id: string, process: any) {
    this.processes.set(id, process);
  }

  getProcess(id: string) {
    return this.processes.get(id);
  }

  removeProcess(id: string) {
    this.processes.delete(id);
  }

  add(item: DownloadItem) {
    this.downloads.set(item.id, item);
  }

  update(id: string, updates: Partial<DownloadItem>) {
    const item = this.downloads.get(id);
    if (item) {
      this.downloads.set(id, { ...item, ...updates });
    }
  }

  get(id: string) {
    return this.downloads.get(id);
  }

  getAll() {
    return Array.from(this.downloads.values());
  }
}

export const downloadStore = new DownloadStore();