# fix/incidents-click-area · amazon · 2026-11-25
- claim: collab/active/fix--incidents-click-area/claim.md

## 이벤트
- changed src/features/article-list/ui/article-card/article-card.tsx 제목 링크의 ::after 가 카드 전체를 덮음(카드는 relative) → 카드 안에 누를 수 있는 요소를 더 넣으면 relative z-10 으로 링크 위에 올릴 것. 카드 안에 <a> 를 중첩하지 말 것
- rule src/features/article-list/ui/article-card/article-card.tsx 카드당 상세 링크는 제목 하나만 둔다 → 카드 전체 클릭은 별도 onClick 이 아니라 이 stretched link 로 유지

## 남은 것
- 키보드 포커스 윤곽은 제목 글자만 감싼다. 카드 전체로 넓힐지는 따로 정한다.
