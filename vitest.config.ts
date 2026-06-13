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

      // 임계값은 vitest가 실제로 측정하는 순수 로직 레이어에만 글롭별로 적용한다.
      // (RN 컴포넌트가 섞인 전역값은 품질을 대표하지 못함)
      // 1단계: 로직 코드가 적은 현재는 70% floor로 시작한다.
      // 2단계: store/services/hooks 로직이 쌓이면 동일 패턴으로 추가하고,
      //        충분히 안정되면 autoUpdate: true 로 래칫(점진 상향)을 켜는 것을 권장한다.
      thresholds: {
        'utils/**': { lines: 70, functions: 70, branches: 60, statements: 70 },
      },
    },
  },
});
