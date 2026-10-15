import { describe, expect, it } from 'vitest';
import { filterIncidents } from './filter-incidents';
import type { Incident } from './types';
const incidents: Incident[] = [
  {
    id: '1',
    title: '화재',
    summary: '진화 진행',
    category: 'society',
    status: 'ongoing',
    occurredAt: '2026-10-01T00:00:00Z',
    location: { address: '서울 강남구', latitude: 37.5, longitude: 127 },
    source: { name: '테스트', url: 'https://example.com/1' },
    timeline: [],
  },
  {
    id: '2',
    title: '상황 종료',
    summary: '진화 완료',
    category: 'society',
    status: 'closed',
    occurredAt: '2026-09-30T00:00:00Z',
    location: { address: '인천', latitude: 37.4, longitude: 126.7 },
    source: { name: '테스트', url: 'https://example.com/2' },
    timeline: [],
  },
];
describe('사건 필터', () => {
  it('주소 검색과 카테고리·상태를 함께 적용한다', () => {
    expect(
      filterIncidents(incidents, {
        query: ' 강남 ',
        category: 'society',
        status: 'ongoing',
      }).map((i) => i.id),
    ).toEqual(['1']);
  });
  it('시작 시각을 포함하고 이전 사건은 제외한다', () => {
    expect(
      filterIncidents(incidents, { since: '2026-10-01T09:00:00+09:00' }).map(
        (i) => i.id,
      ),
    ).toEqual(['1']);
  });
  it('빈 검색은 전체를 반환하고 원본 순서를 유지한다', () => {
    expect(filterIncidents(incidents, { query: '  ' })).toEqual(incidents);
  });
  it('잘못된 날짜를 조용히 무시하지 않는다', () => {
    expect(() => filterIncidents(incidents, { since: 'invalid' })).toThrow(
      RangeError,
    );
  });
});
