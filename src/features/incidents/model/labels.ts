import type { IncidentCategory, IncidentStatus } from './types';

export const categoryLabels: Record<IncidentCategory, string> = {
  society: '사회',
  security: '안보',
  politics: '정치',
  international: '국제',
};

export const statusLabels: Record<IncidentStatus, string> = {
  ongoing: '진행 중',
  publicized: '공론화 성공',
  closed: '종결',
};
