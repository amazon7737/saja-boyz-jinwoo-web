# 흉흉 브랜드

Figma `[가제] 사건사고 지도뷰 사이트`의 `logo / thumbnail` 섹션에서 내보낸 자산이다.

- `hyunghyung.svg`: 심벌과 글자가 함께 있는 워드마크. Figma 노드 `805:235`, 원본 `viewBox="0 0 240 81"`을 유지하며 헤더에 가로 64px로 표시한다.
- `symbol.svg`: 위치 핀과 양옆 전파 모양의 심벌. Figma 노드 `805:349`, 원본 `viewBox="0 0 23 17"`을 유지한다.
- `public/og/site.svg`: 공유 이미지 원본. Figma 노드 `805:232`, 1200×630px이다. 카카오톡과 X가 읽는 `public/og/site-v2.png`는 이 원본에서 생성한다. 기존 공유 주소 `public/og/site.png`는 유지한다.

Figma 앱에서 자산을 가져올 때 재연결 경고가 표시돼 서버와 동기화된 최신 버전인지는 별도로 확인하지 못했다.

## 자산 재생성

- `node scripts/generate-brand-icons.mjs`: 원본 심벌 비율을 유지해 흰 정사각 배경에 배치하고 `src/app/icon.svg`, PNG 96px, Apple 아이콘 180px, ICO 16·32·48px을 만든다.
- `node scripts/generate-og-image.mjs`: `public/og/site.svg`에서 공유용 PNG를 만든다.

두 스크립트는 기존 Next.js 의존성의 `sharp`를 사용한다. `src/app/brand-icons.test.ts`는 심벌의 핀과 전파 신호, 각 크기의 디코딩·여백·SVG 일치를 검사한다.
