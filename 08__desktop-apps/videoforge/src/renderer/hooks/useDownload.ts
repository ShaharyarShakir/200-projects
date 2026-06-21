import { useEffect, useState } from "react";

export function useDownload() {
  const [downloads, setDownloads] = useState<any[]>([]);

  const start = async (url: string, format = "mp4") => {
    const id = await window.api.startDownload(url, format);

    setDownloads((prev) => [
      {
        id,
        url,
        status: "queued",
        progress: 0,
        format,
      },
      ...prev,
    ]);
  };

  const pause = (id: string) => window.api.pauseDownload(id);

  const resume = (id: string) => window.api.resumeDownload(id);

  const cancel = (id: string) => window.api.cancelDownload(id);

  // Load downloads on mount and set up progress listener
  useEffect(() => {
    // Fetch historical downloads
    window.api.getDownloads().then((data) => {
      setDownloads(data);
    });

    // Listen to progress updates
    const unsubscribe = window.api.onProgress((data: any) => {
      setDownloads((prev) =>
        prev.map((d) => (d.id === data.id ? { ...d, ...data } : d))
      );
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    downloads,
    setDownloads,
    start,
    pause,
    resume,
    cancel,
  };
}