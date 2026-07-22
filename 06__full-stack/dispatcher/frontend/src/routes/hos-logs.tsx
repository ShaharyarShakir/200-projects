import { createFileRoute } from '@tanstack/react-router';
import { HosPage } from '../features/hos/pages/HosPage';

export const Route = createFileRoute('/hos-logs')({
  component: HosLogsPage,
});

function HosLogsPage() {
  return <HosPage />;
}
