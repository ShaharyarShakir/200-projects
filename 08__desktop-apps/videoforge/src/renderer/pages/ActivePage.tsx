import { useDownload } from "../hooks/useDownload";
import DownloadTable from "../components/download/DownloadTable";

export default function ActivePage() {
    const { downloads, pause, resume, cancel } =
        useDownload();

    const active = downloads.filter(
        (d) =>
            d.status === "downloading" ||
            d.status === "queued" ||
            d.status === "paused" ||
            d.status === "converting"
    );

    return (
        <DownloadTable
            downloads={active}
            onPause={pause}
            onResume={resume}
            onCancel={cancel}
        />
    );
}