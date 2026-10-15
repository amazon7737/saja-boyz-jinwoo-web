import type { Incident, IncidentFilters } from './types';

export function filterIncidents(
  incidents: readonly Incident[],
  filters: IncidentFilters,
): Incident[] {
  const query = filters.query?.trim().toLocaleLowerCase('ko-KR');
  const since = filters.since ? Date.parse(filters.since) : undefined;

  if (since !== undefined && !Number.isFinite(since))
    throw new RangeError('유효한 시작 날짜가 필요합니다.');

  return incidents.filter((incident) => {
    if (filters.category && incident.category !== filters.category)
      return false;
    if (filters.status && incident.status !== filters.status) return false;
    if (since !== undefined && !(Date.parse(incident.occurredAt) >= since))
      return false;

    return (
      !query ||
      [incident.title, incident.summary, incident.location.address].some(
        (value) => value.toLocaleLowerCase('ko-KR').includes(query),
      )
    );
  });
}
