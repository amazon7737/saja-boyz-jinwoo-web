# codex/map-article-markers · amazon · 2026-10-14

- claim: collab/active/codex--map-article-markers/claim.md

## 이벤트

- supersedes collab/journal/2026-10-14-amazon-map-article-markers-2.md 커밋 이력만 보충한다. 미공유 커밋 04159c7/75afd5b의 저널 필수 절 형식을 보완하기 위해 원격 HEAD d9f3994 확인 후 두 로컬 커밋을 백업 ref에 보존하고 동일 제품 트리로 재커밋했다 → 제품 검증 내용·동작은 유지되며 정규 HEAD는 후속 커밋을 사용할 것.
- rule collab/journal/ 필수 절 이름은 정확히 `## 이벤트`와 `## 남은 것`을 사용한다 → 커밋 전에 형식도 확인할 것.

## 남은 것

- 원격에 공개된 이력과 타인 파일은 바꾸지 않았고 force push·훅 우회·하네스 수정은 없다. 백업은 로컬 `refs/backup/codex-map-article-markers-before-journal-repair-20261014`(75afd5b)다.
- 백업과 재구성 결과의 `git diff --exit-code <backup> -- . ':!collab'`는 차이 없음. 제품 src 트리 d8b874abe49b1ef8ee952a253e66a3f47a186cc6, public 트리 693871acb84eac947aad86b1987378b5f10cf040를 유지한다. package/설정/문서도 collab 외 차이 없다. 97 테스트·빌드 증거를 재사용한다.
- 부모 세션이 정규 HEAD로 Vercel 빌드·실제 브라우저 검증 후 반영한다.
