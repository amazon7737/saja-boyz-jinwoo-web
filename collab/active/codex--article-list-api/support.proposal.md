# 기사 API 라우트 테스트 지원 제안

대상: `vitest.config.ts`. 앱의 기존 `@/*` 경로를 테스트에서도 해석한다. 현재 설정의 Node 환경과 `src/**/*.test.ts` 전체 검색을 유지하며 의존성·명령·기존 13개 테스트를 바꾸지 않는다.

```ts
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
```

프로브는 `3502e66`을 내보낸 별도 임시 복사본에 이 설정만 적용해 실행한다. 실제 앱의 설정·프로덕션 소스·승인된 테스트는 그대로이며 새 구현 stub을 만들지 않았다.
