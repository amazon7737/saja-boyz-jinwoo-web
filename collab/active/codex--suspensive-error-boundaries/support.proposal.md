# 정확한 의존성 지원안

앱 package.json과 pnpm-lock.yaml을 임시 폴더에 복사하고 pnpm add @suspensive/react@3.21.4 --save-exact --lockfile-only --ignore-scripts로 생성했다.
승인 대상은 support/package.json.proposed와 support/pnpm-lock.yaml.proposed의 전체 내용이다. 앱의 실제 package/lock은 아직 바꾸지 않았다.
React peerDependencies: ^18 || ^19. 다른 기존 직접 의존성, 스크립트, Vitest 설정, 기존 23개 테스트는 보존한다.
Sobaya 자동 실행 계약은 저장소의 직접 Vitest 명령을 유지하고 사람용 검증은 pnpm test로 실행한다.
