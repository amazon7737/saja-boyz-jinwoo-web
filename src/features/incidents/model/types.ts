export type IncidentCategory =
  'society' | 'security' | 'politics' | 'international';

export type IncidentStatus = 'ongoing' | 'publicized' | 'closed';

export interface Incident {
  id: string;
  title: string;
  summary: string;
  category: IncidentCategory;
  status: IncidentStatus;
  occurredAt: string;
  location: { address: string; latitude: number; longitude: number };
  source: { name: string; url: string };
  imageUrl?: string;
  timeline: { id: string; occurredAt: string; description: string }[];
}

export interface IncidentFilters {
  query?: string;
  category?: IncidentCategory;
  status?: IncidentStatus;
  since?: string;
}
