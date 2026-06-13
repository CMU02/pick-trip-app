import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // describe/it/expect 등을 import 없이 전역으로 사용
    globals: true,

    // 순수 TypeScript 로직(zustand 스토어, 유틸, 훅 로직) 테스트 용도이므로 node 환경 사용
    // React Native 컴포넌트 렌더링 테스트는 별도 도구(jest-expo)가 필요합니다.
    environment: 'node',

    // 테스트 파일 패턴
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**'],

    // 테스트 간 mock 자동 정리
    clearMocks: true,
    restoreMocks: true,

    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      // RN 컴포넌트/엔트리는 vitest 대상이 아니므로 커버리지에서 제외
      exclude: ['App.tsx', 'index.ts', '**/*.config.ts', '**/node_modules/**'],
    },
  },
});
