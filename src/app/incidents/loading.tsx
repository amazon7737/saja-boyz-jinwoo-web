import { IncidentList } from '@/features/incident-list/ui/incident-list/incident-list';

export default function IncidentsLoading() {
  return <IncidentList state="loading" now={new Date()} />;
}
