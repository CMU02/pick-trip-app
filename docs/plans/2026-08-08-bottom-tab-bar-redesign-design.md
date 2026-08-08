# 하단 탭바 리디자인 설계 명세

**작성일:** 2026-08-08

## 배경

현재 하단 탭바는 아이콘이 이모지 문자열로 하드코딩되어 있고(`components/molecules/TabBar.tsx:13`), 활성 표시는 아이콘 투명도와 라벨 색상 두 가지 스타일 분기뿐이다. 플랫폼별로 이모지 렌더링이 달라 디자인 일관성을 보장할 수 없고, 아이콘을 교체하거나 상태를 추가하기 어렵다.

플로팅 캡슐 형태로 재설계하면서 아이콘을 아이콘 폰트로 교체하고, 함께 요청된 색상 팔레트 교체와 폰트 교체까지 포함해 작업 전체를 4개 이슈로 분해한다.

## 목표

- 하단 탭바를 화면 위에 떠 있는 캡슐 형태로 바꾸고, 활성 탭이 가로로 확장되며 라벨이 나타나게 한다
- 이모지 아이콘을 Ionicons로 교체한다
- 색상 팔레트를 amber 계열에서 coral 계열로 전환한다
- 앱 폰트를 Paperlogy로 교체한다

## 비목표

- 탭 구성 변경 (홈·탐색·바구니·내 정보 4개 유지)
- 탭 안에 중첩 스택 도입
- 화면 콘텐츠·레이아웃 변경 (탭바에 가리지 않도록 하단 여백을 조정하는 것 외)

---

## 작업 분해

작업은 4개 이슈로 나눈다. 화살표는 의존 관계다.

```
chore/30  New Architecture 전환  ─┐
                                  ├─→  feat/32  하단 탭바 리디자인
style/31  색상 amber → coral    ─┘

chore/33  Paperlogy 폰트 전역 적용   (독립, 마지막)
```

| 이슈 | 브랜치 | 범위 | 분리 근거 |
|---|------|------|----------|
| [#30](https://github.com/CMU02/pick-trip-app/issues/30) | `chore/30` | `app.json` 1줄 + `expo prebuild --clean` + 전 화면 회귀 확인 | 실패 시 롤백 단위가 탭바와 달라야 한다. Reanimated 4의 전제 조건 |
| [#31](https://github.com/CMU02/pick-trip-app/issues/31) | `style/31` | `COLORS` 토큰 6개 개명 + 69건 치환 (18개 파일) | 기계적 치환 diff에 설계 리뷰가 섞이면 안 된다 |
| [#32](https://github.com/CMU02/pick-trip-app/issues/32) | `feat/32` | 탭바 + 아이콘 + CTA 겹침 해소 (파일 9개) | 실제 설계·리뷰 대상 |
| [#33](https://github.com/CMU02/pick-trip-app/issues/33) | `chore/33` | 폰트 3종 + `font-weight` → `font-family` 전역 치환 (73곳 이상) | 폰트가 바뀌면 탭 라벨 너비가 달라지므로 탭바 확정 후 착수 |

#30과 #31은 서로 독립이라 병렬 진행할 수 있다. 둘 다 머지된 뒤 #32를 시작하면 탭바를 처음부터 coral + Reanimated로 만들 수 있어 재작업이 없다.

`git-convention`의 브랜치 규칙에 따라 브랜치명은 `<type>/<이슈번호>` 형식을 따른다.

> #31의 브랜치 타입은 `style`이지만 이슈 라벨은 `chore`다. 저장소에 `style` 라벨이 없어 가장 가까운 기존 라벨을 썼다. 커밋 메시지는 `git-convention`의 `style` 타입을 따른다.

---

## #30 — New Architecture 전환

### 근거

- `app.json`의 `"newArchEnabled": false`는 초기 커밋(`765fc6e`)부터 한 번도 변경되지 않았다. 문제를 겪고 끈 것이 아니라 스캐폴드 기본값이 남은 것이다
- Expo 공식 문서: **SDK 54가 New Architecture를 끌 수 있는 마지막 버전**이다. SDK 55부터는 강제 활성화되므로 어차피 거쳐야 하는 작업이다
- Reanimated 4.1.7은 New Architecture 전용이다 (`node_modules/react-native-reanimated/README.md:29`). #32의 탭바 애니메이션은 레이아웃 값(`flexGrow`, `width`)을 애니메이션하므로 내장 `Animated`로는 `useNativeDriver: false`밖에 쓸 수 없어 JS 스레드에서 돈다. Reanimated는 UI 스레드에서 처리한다

### 사전 검증 결과

`bunx expo-doctor@latest` 18개 검사 중 17개 통과. 실패한 하나는 New Architecture와 무관하다.

```
✔ Validate packages against React Native Directory package metadata
✔ Check that native modules do not use incompatible support packages
✖ Check that packages match versions required by installed Expo SDK
     expo  expected ~54.0.36  found 54.0.35
```

네이티브 모듈별 `codegenConfig` 보유 현황:

| 패키지 | 버전 | codegenConfig |
|---|---|---|
| `@react-native-async-storage/async-storage` | 2.2.0 | O |
| `react-native-gesture-handler` | 2.28.0 | O |
| `react-native-safe-area-context` | 5.6.2 | O |
| `react-native-screens` | 4.16.0 | O |
| `react-native-worklets` | 0.8.3 | O |
| `react-native-reanimated` | 4.1.7 | O |
| `@react-native-masked-view/masked-view` | 0.3.2 | X |

`masked-view`만 `codegenConfig`가 없으나, Expo 문서가 비호환으로 지목한 것은 `@react-native-community/masked-view`이고 **대체재로 권장하는 것이 우리가 쓰는 `@react-native-masked-view/masked-view`** 다. 앱 코드에서 직접 import하지 않는 `@react-navigation/stack`의 전이 의존성이며, RN 0.74부터 기본 활성화된 인터롭 레이어로 동작한다.

### 변경 사항

`android/`가 `.gitignore:42`에 등록된 CNG 프로젝트이므로 `gradle.properties`의 `newArchEnabled=false`는 `app.json`에서 생성된 결과물이다. 커밋 대상은 `app.json` 한 줄뿐이다.

```diff
- "newArchEnabled": false,
+ "newArchEnabled": true,
```

이후 `bun expo prebuild --clean && bun expo run:android`.

### 리스크

정적 검사가 모두 통과해도 런타임 이슈는 실기로만 확인된다. Expo 문서도 *"For most non-trivial apps, you're likely to encounter some issues"* 라고 명시한다. **전 화면 회귀 확인이 이 이슈의 실제 비용**이다.

### 완료 조건

- `app.json`의 `newArchEnabled`가 `true`
- `bun expo prebuild --clean` 후 Android 빌드 성공
- 전 화면 수동 회귀 확인: 지역 선택 → 날짜 → 동행 → 탐색 → 우선순위 → 일정 결과, 로그인(카카오/구글), 일정 저장·이어하기·공유
- `bunx tsc --noEmit`, `bun run test:run` 통과

---

## #31 — 색상 팔레트 amber → coral

### 변경 사항

`constants/colors.ts`의 amber 6단계를 coral로 교체하고 **토큰명까지 개명**한다.

| 기존 토큰 | 기존 hex | 신규 토큰 | 신규 hex |
|---|---|---|---|
| `amber50` | `#FFF8E1` | `coral50` | `#FFF1EF` |
| `amber100` | `#FFECB3` | `coral100` | `#FFD9D4` |
| `amber300` | `#FFD166` | `coral300` | `#F09080` |
| `amber500` | `#F59E0B` | `coral500` | `#E8614D` |
| `amber600` | `#D97706` | `coral600` | `#D14D3A` |
| `amber700` | `#B45309` | `coral700` | `#B53D2D` |

hex만 바꾸고 토큰명을 두면 `amber500`이 코랄색을 가리키게 되어 다음에 읽는 사람이 반드시 오해한다. 69건은 순수 기계적 치환이고 `tsc`가 누락을 잡아주므로 개명이 맞다.

### 유지하는 것

- **`warning: '#F59E0B'`** — 기존 `amber500`과 같은 hex지만 의미 토큰이다. 주황을 유지한다. 경고색까지 코랄이 되면 `error: '#DC2626'`과 구분되지 않는다
- **`teal` 6단계** — 앱 내 7건 사용. 코랄과 보색에 가까워 잘 어울리므로 그대로 둔다

### 영향 범위

18개 파일 69건.

```
screens/HomeContent.tsx              9
screens/ItineraryResultScreen.tsx    8
constants/colors.ts                  6
components/molecules/ProgressChecklist.tsx  6
screens/PrioritySelectScreen.tsx     5
screens/ContentExploreScreen.tsx     5
components/molecules/ContentCard.tsx 5
screens/ProfileContent.tsx           4
screens/BasketContent.tsx            4
components/molecules/ContentDetailModal.tsx  3
screens/SharedItineraryScreen.tsx    2
screens/ResumeItineraryScreen.tsx    2
components/molecules/TripDatePickerModal.tsx 2
components/molecules/TabBar.tsx      2
components/molecules/DurationSelector.tsx    2
components/molecules/CategoryFilter.tsx      2
screens/AuthScreen.tsx               1
components/molecules/PriorityChips.tsx       1
```

### 확인이 필요한 점

Coral 500(`#E8614D`)과 `error`(`#DC2626`)가 둘 다 붉은 계열이다. CTA 버튼이 붉어지므로 "삭제/오류"와 "주요 액션"의 색 구분이 지금보다 약해진다. **실기에서 두 색이 나란히 보이는 화면을 확인**해야 한다 — 특히 `BasketContent`(삭제 + CTA 공존)와 `ItineraryResultScreen`.

### 완료 조건

- `constants/colors.ts`에 `amber*` 토큰이 남아 있지 않음. `warning`은 hex `#F59E0B`를 그대로 유지하되 토큰명은 `warning`이므로 무관하다
- 앱 코드 전체에서 `amber` 문자열 검색 결과 0건
- `bunx tsc --noEmit`, `bun run test:run` 통과
- 실기에서 coral500과 error가 함께 보이는 화면의 색 구분 확인

---

## #32 — 하단 탭바 리디자인

**전제:** #30, #31 머지 완료

### 최종 형태

- 화면 하단에서 띄운 흰 캡슐이 콘텐츠 위에 떠 있고, 스크롤하면 콘텐츠가 캡슐 뒤로 지나간다
- 활성 탭은 가로로 확장되며 `coral50` 배경 캡슐과 라벨이 나타나고, 비활성 탭은 아이콘만 표시한다
- 활성 아이콘·라벨은 `coral600`, 비활성은 `gray400`

탭이 4개라 레퍼런스(3개)를 그대로 옮기면 "내 정보" 라벨이 빠듯해지므로, 활성 탭만 라벨을 표시하는 형태를 택했다.

### 변경 파일

| 파일 | 작업 |
|---|---|
| `constants/layout.ts` | 신규 — 탭바 치수 상수 |
| `navigation/tabRoutes.ts` | 신규 — `TAB_ROUTE_PAIRS` + 매핑 함수 2개 분리 |
| `navigation/tabRoutes.test.ts` | 신규 — 매핑 왕복·폴백 테스트 |
| `components/molecules/TabBar.tsx` | 전면 재작성 |
| `navigation/MainTabNavigator.tsx` | 매핑 함수를 import로 교체 |
| `screens/HomeContent.tsx` | 스크롤 하단 여백 |
| `screens/ProfileContent.tsx` | 스크롤 하단 여백 |
| `screens/ContentExploreScreen.tsx` | CTA 바를 탭바 위로 + 스크롤 여백 |
| `screens/BasketContent.tsx` | CTA 바를 탭바 위로 + 스크롤 여백 |

### 레이아웃 상수

6개 파일이 같은 수치를 알아야 하므로 한 곳에 둔다.

```ts
// constants/layout.ts
export const TAB_BAR_HEIGHT = 58;        // 캡슐 높이
export const TAB_BAR_BOTTOM = 14;        // 화면 하단에서 띄우는 거리
export const TAB_BAR_SIDE = 14;          // 캡슐 좌우 여백 (TabBar의 left/right)
export const TAB_BAR_TOTAL = TAB_BAR_HEIGHT + TAB_BAR_BOTTOM;   // CTA 바를 올릴 높이
export const TAB_BAR_CLEARANCE = TAB_BAR_TOTAL + 12;            // 스크롤이 확보할 여백
```

Safe Area는 `MainTabNavigator`의 `ScreenContainer`가 이미 `SafeAreaView`라 하단 인셋을 패딩으로 넣는다. 탭바를 그 안에서 `bottom: TAB_BAR_BOTTOM`으로 두면 인셋 **위에** 뜨므로 런타임 계산 없이 상수로 충분하다.

### 탭바 배치

`TabBar` 컴포넌트 자체가 `position: absolute`를 갖는다. bottom-tabs는 `tabBar`로 넘긴 컴포넌트를 화면 아래 flex 아이템으로 배치하는데, absolute면 흐름에서 빠져 오버레이가 된다. `MainTabNavigator`가 넘기는 props(`active` / `onChange` / `basketCount`)는 그대로 유지한다.

### 아이콘

`@expo/vector-icons`의 Ionicons를 쓴다. expo에 번들되어 있어 설치가 필요 없다. 활성은 채운 형태, 비활성은 아웃라인이다.

| 탭 | 활성 | 비활성 |
|---|---|---|
| 홈 | `home` | `home-outline` |
| 탐색 | `search` | `search-outline` |
| 바구니 | `bookmark` | `bookmark-outline` |
| 내 정보 | `person` | `person-outline` |

바구니는 기존 이모지가 🔖(북마크)였으므로 `bookmark`로 맞췄다.

### 애니메이션

`react-native-reanimated`를 **직접 의존성으로 추가**한다 (현재는 전이 의존성). `bunx expo install react-native-reanimated`.

탭 하나가 자기 활성 여부만 알고 스스로 애니메이션한다.

```tsx
const containerStyle = useAnimatedStyle(() => ({
  flexGrow: withTiming(active ? 1.75 : 1, { duration: 260 }),
}));

const labelStyle = useAnimatedStyle(() => ({
  width:      withTiming(active ? labelWidth : 0, { duration: 260 }),
  opacity:    withTiming(active ? 1 : 0, { duration: 200 }),
  marginLeft: withTiming(active ? 6 : 0, { duration: 260 }),
}));
```

**`labelWidth`:** 라벨마다 폭이 다르다("홈" vs "내 정보"). 고정값 60px로 시작하고, 실기에서 "내 정보"가 잘리면 `onLayout` 측정으로 바꾼다.

**캡슐 배경:** `backgroundColor`를 `'transparent'` ↔ hex로 보간하면 플랫폼별로 불안정하다. 별도 `Animated.View`를 깔고 `opacity`를 애니메이션한다.

### 뱃지

바구니 뱃지는 활성·비활성 모두 **아이콘 우상단 고정**이다. 라벨이 열려도 아이콘 기준이라 위치가 흔들리지 않는다. 표시 조건은 기존과 동일하게 `basketCount > 0`.

### CTA 바 겹침 해소

`ContentExploreScreen`과 `BasketContent`에는 이미 자체 하단 CTA 바가 있어 플로팅 탭바와 겹친다.

| 위치 | 현재 | 변경 |
|---|---|---|
| `ContentExploreScreen.tsx:83` `BottomBar` | `position:absolute; bottom:0` | `bottom: TAB_BAR_TOTAL` |
| `ContentExploreScreen.tsx:149` | `paddingBottom: selectedIds.length > 0 ? 120 : 40` | 각각 `+ TAB_BAR_TOTAL` / `+ TAB_BAR_CLEARANCE` |
| `BasketContent.tsx:68` `BottomBar` | 일반 흐름 최하단 | `margin-bottom: TAB_BAR_TOTAL` |
| `BasketContent.tsx:113` | `paddingBottom: 24` | `24 + TAB_BAR_CLEARANCE` |
| `HomeContent.tsx` | 하단 여백 없음 | `paddingBottom: TAB_BAR_CLEARANCE` |
| `ProfileContent.tsx` | 하단 여백 없음 | `paddingBottom: TAB_BAR_CLEARANCE` |

### 테스트

`TAB_ROUTE_PAIRS`와 매핑 함수 2개를 `navigation/tabRoutes.ts`로 분리하고 vitest 테스트를 붙인다. 기존 테스트가 전부 순수 로직(`services/scheduleActions.test.ts`, `services/shareItineraryText.test.ts`, `utils/calculateNights.test.ts`)이라 이 관례를 따른다. 컴포넌트 테스트는 선례가 없어 만들지 않는다.

검증 항목: 라우트명 → TabKey → 라우트명 왕복, 알 수 없는 값의 폴백(`'home'` / `'Home'`).

### 완료 조건

- `bunx tsc --noEmit`, `bun run test:run` 통과
- 에뮬레이터에서 확인
  - 4개 탭 전환 시 캡슐이 부드럽게 확장·축소
  - 탐색·바구니 화면에서 CTA 버튼이 탭바에 가리지 않음
  - 4개 탭 화면 모두 스크롤 최하단에서 마지막 항목이 가리지 않음
  - 바구니 뱃지가 활성·비활성 전환 시 위치를 유지
  - "내 정보" 라벨이 잘리지 않음
- 앱 코드에 이모지 아이콘 문자열 0건

### 범위 밖

- **하단 페이드 그라디언트** — 콘텐츠가 탭바 뒤로 사라질 때의 장식. 마지막 단계로 두고 실기 확인 후 판단한다. `expo-linear-gradient`가 이미 설치돼 있어 추가 비용은 없다
- **`tabPress` 이벤트 패턴** — 현재 `CustomTabBar`는 `navigation.navigate`를 직접 호출한다(`MainTabNavigator.tsx:45`). React Navigation 권장 패턴은 `tabPress`를 emit하고 `defaultPrevented`를 확인하는 것이며, 이 차이로 활성 탭 재탭 시 pop-to-top이 동작하지 않는다. 탭 안에 중첩 스택이 없어 지금은 증상이 없으므로 필요해질 때 고친다

---

## #33 — Paperlogy 폰트 전역 적용

**전제:** #32 머지 완료 (탭 라벨 너비가 확정된 뒤)

### 변경 사항

Paperlogy 9종 중 코드베이스가 실제로 쓰는 weight 3종만 `assets/fonts/`에 넣는다.

| weight | 파일 | 크기 |
|---|---|---|
| 500 | `Paperlogy-5Medium.ttf` | ~1.3MB |
| 600 | `Paperlogy-6SemiBold.ttf` | ~1.3MB |
| 700 | `Paperlogy-7Bold.ttf` | ~1.3MB |

`app.json`의 `plugins`에 `expo-font`를 추가해 빌드 시점에 임베드한다. 런타임 로딩과 스플래시 깜빡임을 피하기 위해서다.

### 핵심 제약

**커스텀 폰트를 쓰면 React Native에서 `font-weight` 숫자값이 신뢰할 수 없게 동작한다.** iOS와 Android가 다르게 처리하므로, 표준 해법은 weight마다 `font-family`를 직접 지정하는 것이다.

`constants/typography.ts`에 매핑을 두고 전역을 치환한다. 정적 `font-weight: <숫자>` 형태가 73곳이고, `TabBar.tsx`처럼 `font-weight: ${({ $active }) => ...}` 로 분기하는 동적 선언이 추가로 있으므로 실제 대상은 그보다 많다.

```ts
export const FONT = {
  medium:   'Paperlogy-5Medium',
  semibold: 'Paperlogy-6SemiBold',
  bold:     'Paperlogy-7Bold',
};
```

```diff
- font-weight: 600;
+ font-family: ${FONT.semibold};
```

### 완료 조건

- 앱 코드에 `font-weight` / `fontWeight` 선언 0건 (styled-components·인라인 스타일 모두)
- iOS·Android 양쪽에서 굵기 3단계가 시각적으로 구분됨
- 탭 라벨("내 정보")이 잘리지 않음 — 폰트 변경으로 폭이 달라지므로 재확인
- `bunx tsc --noEmit`, `bun run test:run` 통과

---

## 결정 근거 요약

| 결정 | 대안 | 선택 근거 |
|---|---|---|
| Ionicons (`@expo/vector-icons`) | lucide + react-native-svg, 커스텀 SVG | expo에 번들되어 설치 0. outline·filled 쌍이 있어 활성 표현이 그대로 됨 |
| 활성 탭만 라벨 표시 | 4탭 전부 라벨, 하단 고정 바 | 레퍼런스는 3탭이라 4탭에서 "내 정보"가 빠듯함 |
| 콘텐츠가 탭바 뒤로 지나감 | 네비게이터에서 여백 확보 | 플로팅 탭바의 시각적 의도를 살림. 대신 화면 4개 여백 조정이 필요 |
| Reanimated 4 | RN 내장 `Animated` | 애니메이션 대상이 레이아웃 값(`flexGrow`/`width`)이라 내장 `Animated`는 `useNativeDriver: false`로만 가능해 JS 스레드에서 돎 |
| 토큰명까지 `coral`로 개명 | hex만 교체 | `amber500`이 코랄색을 가리키면 다음에 읽는 사람이 오해함 |
| 이슈 4개로 분리 | 한 이슈로 통합 | 롤백 단위 분리, 기계적 치환 diff와 설계 리뷰의 분리 |
