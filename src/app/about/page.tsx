import Link from 'next/link';

import { pageMetadata } from '../site-metadata';

export const metadata = pageMetadata(
  '서비스 안내',
  '흉흉의 기사 검색, 지도 위치, 발행일, AI 생성 이미지와 원문 확인 방법을 안내합니다.',
  '/about',
);

const answers = [
  [
    '무엇을 살펴볼 수 있나요?',
    '흉흉 · 내 주변의 사건 사고는 수집된 사건 사고 기사를 지도와 목록에서 살펴보고 키워드로 검색하는 서비스입니다.',
  ],
  [
    '지도 위 숫자 원은 무엇인가요?',
    '숫자 원은 지도에서 함께 표시하는 기사 묶음입니다. 고유 사건 수나 위험도를 뜻하지 않으며, 선택하면 관련 기사를 확인할 수 있습니다.',
  ],
  [
    '지도는 정확한 현장을 표시하나요?',
    '지역 대표 좌표는 기사와 관련된 지역을 나타내며 정확한 사건 현장과 다를 수 있습니다. 실제 위치와 상황은 원문을 확인해 주세요.',
  ],
  [
    '표시된 날짜는 사건 발생 시각인가요?',
    '기사 발행 날짜는 원문 기사가 발행된 시각입니다. 사건 발생 시각과 다를 수 있으며, 기간 필터 역시 기사 발행 시각을 기준으로 합니다.',
  ],
  [
    'AI 생성 이미지는 현장 사진인가요?',
    'AI 생성 표기가 있는 이미지는 기사의 이해를 돕는 이미지이며 실제 현장 사진이 아닙니다. 제공되는 이미지가 없으면 이미지 없음으로 표시합니다.',
  ],
  [
    '내용과 출처는 어디서 확인하나요?',
    '기사 상세에서 요약과 원문 링크를 확인할 수 있습니다. 요약만으로 판단하지 말고 원문에서 맥락과 최신 내용을 확인해 주세요. 흉흉은 원문 기사의 취재·발행 주체가 아닙니다.',
  ],
  [
    '사건 분류와 진행 상태도 확인할 수 있나요?',
    '현재 사건 분류와 진행 상태 정보는 제공하지 않습니다. 지도와 목록의 기사가 모든 사건을 빠짐없이 포함하는 것은 아닙니다.',
  ],
];

export default function AboutPage() {
  return (
    <section className="py-6 text-text">
      <h1 className="m-0 text-[22px]/[30px] font-extrabold">
        흉흉 · 내 주변의 사건 사고
      </h1>
      {answers.map(([question, answer]) => (
        <section key={question} className="mt-6">
          <h2 className="text-base font-bold">{question}</h2>
          <p className="text-sm leading-6 text-muted">{answer}</p>
        </section>
      ))}
      <nav aria-label="기사 찾아보기" className="flex flex-wrap gap-4 py-4">
        <Link href="/incidents" className="ui-link text-brand underline">
          기사 목록
        </Link>
        <Link href="/archive" className="ui-link text-brand underline">
          기사 아카이브
        </Link>
      </nav>
    </section>
  );
}
