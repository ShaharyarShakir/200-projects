import { useDownload } from "../hooks/useDownload";
import DownloadTable from "../components/download/DownloadTable";

export default function CompletedPage() {
    const { downloads, cancel } = useDownload();

    const completed = downloads.filter(
        (d) => d.status === "completed"
    );

    return <DownloadTable downloads={completed} onCancel={cancel} />;
}