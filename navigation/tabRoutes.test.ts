import { describe, expect, it } from 'vitest';
import { routeNameToTabKey, TAB_ROUTE_PAIRS, tabKeyToRouteName } from './tabRoutes';

describe('탭 라우트 매핑', () => {
  it('라우트명 → TabKey → 라우트명 왕복이 보존된다', () => {
    for (const [routeName] of TAB_ROUTE_PAIRS) {
      expect(tabKeyToRouteName(routeNameToTabKey(routeName))).toBe(routeName);
    }
  });

  it('TabKey → 라우트명 → TabKey 왕복이 보존된다', () => {
    for (const [, tabKey] of TAB_ROUTE_PAIRS) {
      expect(routeNameToTabKey(tabKeyToRouteName(tabKey))).toBe(tabKey);
    }
  });

  // 매핑에 없는 값이 들어와도 탭바가 빈 상태가 되지 않도록 홈으로 떨어뜨린다.
  it('알 수 없는 라우트명은 home으로 떨어진다', () => {
    expect(routeNameToTabKey('Unknown' as never)).toBe('home');
  });

  it('알 수 없는 TabKey는 Home으로 떨어진다', () => {
    expect(tabKeyToRouteName('unknown' as never)).toBe('Home');
  });
});
