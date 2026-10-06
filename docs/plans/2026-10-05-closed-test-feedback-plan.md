# 비공개 테스트 피드백 수정 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 2026-10-05 비공개 테스트에서 나온 피드백 9건(버그 4, UI 개선 4, 성능 1)을 고친다.

**Architecture:** 화면 단위로 독립된 작업이라 PR 7개로 나눈다. 순수 로직(문자열 파싱, 요청 body 조립, 페이지 크기 계산)은 `utils/`·`services/`의 함수로 빼서 vitest로 고정하고, 화면 변경은 그 함수를 쓰는 얇은 배선으로 둔다. 컴포넌트 렌더링 테스트 환경은 없으므로(vitest `environment: 'node'`) UI는 실기기 확인으로 검증한다.

**Tech Stack:** TypeScript ~5.9, React Native 0.81, Expo 54, styled-components 6, react-query 5, react-navigation 7(stack), vitest 4, Biome.

**Spec:** 이 문서의 "피드백 원문과 원인" 절(사용자 피드백 + 코드 조사 결과).

## 피드백 원문과 원인

| # | 피드백 | 조사 결과 | Task |
|---|---|---|---|
| 1 | 우선순위 화면 "일차별 시작 시각"을 눌러서 직접 입력 | `PrioritySelectScreen.tsx:705-744` 스테퍼(30분 단위 ±)만 있음. 시간 선택 라이브러리 없음 | 2 |
| 2 | 체류시간 기본 2시간인데 누르면 1시간으로 돌아감 | **원인 확인됨.** `PrioritySelectScreen.tsx:51` `STAY_DEFAULT_MINUTES = 60`, `:572` `base = current ?? STAY_DEFAULT_MINUTES`. 콘텐츠의 `stayDuration`("약 2~3시간")을 무시하고 60분에서 시작. 한 번 정하면 서버가 null로 못 되돌려(`types/basket.ts:10-13`) 60분이 영구 덮어쓰기됨 | 1 |
| 3 | 상세 화면 운영시간을 한 줄씩 보기 좋게 | `ContentDetailScreen.tsx:351-355` `withLineBreaks`는 `<br>`만 줄바꿈. `[숙박]- 입실 14:00- 퇴실 11:00[물썰매장]…`처럼 붙어 옴 | 3 |
| 4 | 게스트인데 내 정보에 로그아웃 버튼 | **이미 수정됨.** `8895f64`(2026-09-09) `ProfileContent.tsx:676` `!isGuest &&`. 프로덕션 빌드 `cf2e629`(versionCode 6)에도 포함. 테스터 설치본이 그 이전 빌드(1.0.1 versionCode 3, 2026-09-05)이고, OTA가 채널 미연결로 전달되지 않았던 것(#82에서 해결)으로 보임 | 0 |
| 5 | 여행 저장 시 "저장 실패 / 입력값을 확인해주세요." | 서버 400 `VALIDATION_FAILED`의 message. 서버 계약(`https://api.pick-trip.app/v3/api-docs` `SaveItineraryRequest`): `title` minLength 1, `region` ∈ HADONG/YEONGJU/YECHEON, `duration` 필수, `days` minItems 1, `items` minItems 1, `contentId` minLength 1. 앱은 `duration`(`nightsToApiDuration(null)` → null)과 `region`(`'' .toUpperCase()`)을 계약 위반 값으로 보낼 수 있음. 어느 필드였는지는 로그로 확정 필요 | 5 |
| 6 | 콘텐츠 사진·목록이 느림, 50개 → 20개씩 | 페이지 크기는 이미 지역당 20(`contentService.ts:52`)이지만 지역 3개면 한 번에 60개. 목록이 `ScrollView` + `.map`(`ContentExploreScreen.tsx:249-301`)이라 가상화 없음. 이미지는 RN `Image`(캐시 정책 없음), `expo-image` 미설치 | 7, 8 |
| 7 | 일정 카드의 주소와 설명 구분 | `StopAddress`(11px gray500)와 `ReasonText`(11.5px gray700)가 거의 같은 모양, 간격 9px. 결과·저장 화면에 같은 코드가 복제돼 있음 | 4 |
| 8 | 일정 저장 후에도 바구니가 그대로 | `useBasket.clearItems()`는 있지만 지역 변경 때만 호출. 저장 성공 경로(`ItineraryResultScreen.tsx:831-838` → `RootNavigator.tsx` `onGoHome`)에서 안 부름 | 6 |
| 9 | 공유가 텍스트로 나옴 → UI로 | `shareItineraryText.ts` 텍스트 + `picktrip://share/<token>`(메신저에서 링크 안 됨). 웹에 `https://www.pick-trip.app/share/<token>` 페이지와 OG 메타가 이미 있음(실제 토큰으로 200·og:title 확인) | 9 |
| 10 | "+ 장소 추가"를 인라인 목록 대신 페이지 이동으로 | 결과 화면 `:1193-1207`, 저장 화면 `:839-856`에 같은 인라인 목록 복제. 지역 첫 페이지 20개만, 검색·사진 없음 | 10 |

**범위 밖으로 발견한 것:** 사용자가 공유한 일정은 영주 장소 5곳인데 저장된 region이 `HADONG`(웹 공유 페이지 og:title "하동 | PickTrip"). `submitSave`의 `plan?.region`이 서버 바구니 조건의 지역을 그대로 쓰기 때문으로 보인다. 이번 계획에는 넣지 않고 별도 이슈로 남긴다.

## Global Constraints

- 각 PR은 git-convention 스킬의 워크트리 흐름(`<type>/<task-name>` 브랜치 + `-work` 워크트리)을 따른다. 커밋 제목은 한국어.
- **네이티브 의존성 추가 금지(Task 8 제외).** `runtimeVersion.policy`가 `appVersion`이라 네이티브가 바뀌면 `app.json` `version`을 먼저 올려야 한다(Task 8만 해당). 나머지는 OTA로 나간다.
- main 머지 = 즉시 production OTA(채널 `production` → EAS 브랜치 `main`). 머지 전 실기기 확인을 PR 테스트 플랜에 남긴다.
- 체류시간 범위 10~480분, 10분 단위(서버 검증). 일차 시작 시각 05:00~18:00, 30분 단위(서버 검증).
- 순수 로직은 `utils/*.test.ts` 또는 `services/*.test.ts`로 고정. `utils/**`는 커버리지 임계값(lines 70%)이 걸려 있다.
- 테스트 실행: `bun run test:run`. 린트: `bun run lint`. 타입: `bunx tsc --noEmit`.
- 코드 주석은 주변처럼 한국어로, "왜"를 쓴다.

## Review Focus

1. **체류시간 문자열이 비정형일 때** ("30분~1시간", "1시간 30분", "반나절", null): 파싱 실패하면 60분 기본값으로 떨어지고 화면이 깨지지 않아야 한다. → Task 1 테스트에 포함.
2. **운영시간의 시각 범위 하이픈** ("09:00 - 18:00", "10:00-12:00"): 글머리표(`- 입실`)로 오인해 줄을 쪼개면 안 된다. → Task 3 테스트에 포함.
3. **날짜를 고르지 않은 채 저장**(`duration` null): 서버 계약상 필수라 일정의 일수로 채워 보내야 한다. → Task 5 테스트에 포함.
4. **지역 여러 개 선택 시 페이지 크기**: 지역 3개면 지역당 7개씩, 합쳐서 20개 남짓이어야 하고 `hasMore`가 지역별 크기로 계산돼야 한다. → Task 7 테스트에 포함.
5. **카카오톡 링크 미리보기**: 웹 `robots.txt`가 `/share`를 Disallow한다. 카카오 스크랩 봇이 이를 따르면 미리보기 카드가 안 나온다. → Task 9 Step 5에서 카카오 공유 디버거로 확인하고, 안 나오면 웹 레포(pick-trip-client) 이슈로 넘긴다.

---

## PR 구성

| PR | 브랜치 | Task |
|---|---|---|
| A | `fix/priority-time-inputs` | 1, 2 |
| B | `fix/content-detail-hours` | 3 |
| C | `fix/stop-card-address` | 4 |
| D | `fix/itinerary-save` | 5, 6 |
| E | `fix/content-list-performance` | 7 (Task 8은 별도 PR, 사용자 승인 후) |
| F | `feat/share-web-link` | 9 |
| G | `feat/add-place-screen` | 10 |

---

### Task 0: 게스트 로그아웃 버튼 — 확인만

**Files:** 없음 (코드 변경 없음)

- [ ] **Step 1: 테스터 설치본 버전 확인**

테스터에게 앱 정보(설정 > 앱 > PickTrip)의 버전 코드를 받는다. 6 미만이면 원인은 구버전 설치본이다.

- [ ] **Step 2: OTA 적용 후 재확인**

테스터가 앱을 완전히 종료 → 실행 → 다시 종료 → 실행(OTA 다운로드 후 적용)한 뒤 게스트 상태로 내 정보 탭에 로그아웃 버튼이 없는지 확인한다. 런타임 1.0.1 설치본이면 OTA로 `8895f64`가 포함된 JS를 받는다. 여전히 보이면 그때 `ProfileContent.tsx:676`과 `AppStateContext.tsx:114`의 `isGuest` 초기화를 조사한다.

---

### Task 1: 체류시간 기본값을 콘텐츠의 예상 체류에서 시작 (PR A)

**Files:**
- Create: `utils/stayDuration.ts`
- Test: `utils/stayDuration.test.ts`
- Modify: `screens/PrioritySelectScreen.tsx:46-51, 567-576, 813-825`

**Interfaces:**
- Produces: `parseStayDurationMinutes(text: string | null): number | null` — 문자열의 하한(범위면 앞쪽 값)을 분으로. 해석 불가면 null.
- Produces: `defaultStayMinutes(text: string | null): number` — 위 값을 10~480으로 자르고 10분 단위로 반올림. 해석 불가면 60.

- [ ] **Step 1: 실패하는 테스트 작성**

`utils/stayDuration.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { defaultStayMinutes, parseStayDurationMinutes } from './stayDuration';

describe('parseStayDurationMinutes', () => {
  it('"약 2시간"은 120분', () => {
    expect(parseStayDurationMinutes('약 2시간')).toBe(120);
  });

  // 범위는 짧은 쪽을 기본값으로 쓴다 — 사용자가 늘리는 건 쉽지만, 길게 잡으면 일정이 밀린다.
  it('"약 2~3시간"은 범위 앞쪽인 120분', () => {
    expect(parseStayDurationMinutes('약 2~3시간')).toBe(120);
  });

  it('"1시간 30분"은 90분', () => {
    expect(parseStayDurationMinutes('1시간 30분')).toBe(90);
  });

  it('"약 30분"은 30분', () => {
    expect(parseStayDurationMinutes('약 30분')).toBe(30);
  });

  it('"30분~1시간"은 앞쪽 단위를 따라 30분', () => {
    expect(parseStayDurationMinutes('30분~1시간')).toBe(30);
  });

  it('"1.5시간"은 90분', () => {
    expect(parseStayDurationMinutes('1.5시간')).toBe(90);
  });

  it('숫자가 없으면 null', () => {
    expect(parseStayDurationMinutes('반나절')).toBeNull();
  });

  it('null이면 null', () => {
    expect(parseStayDurationMinutes(null)).toBeNull();
  });
});

describe('defaultStayMinutes', () => {
  it('해석되면 그 값', () => {
    expect(defaultStayMinutes('약 2~3시간')).toBe(120);
  });

  it('해석 안 되면 60분', () => {
    expect(defaultStayMinutes('반나절')).toBe(60);
    expect(defaultStayMinutes(null)).toBe(60);
  });

  it('서버 범위(10~480분)로 자른다', () => {
    expect(defaultStayMinutes('5분')).toBe(10);
    expect(defaultStayMinutes('약 10시간')).toBe(480);
  });

  it('스테퍼 단위(10분)로 반올림한다', () => {
    expect(defaultStayMinutes('약 45분')).toBe(50);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `bunx vitest run utils/stayDuration.test.ts`
Expected: FAIL — `Cannot find module './stayDuration'` 류

- [ ] **Step 3: 구현**

`utils/stayDuration.ts`:

```ts
// 콘텐츠 상세의 "예상 체류"(stayDuration)는 서버가 사람이 읽을 문장으로 준다("약 2~3시간",
// "1시간 30분"). 우선순위 화면의 체류시간 스테퍼는 분 단위 숫자가 필요해서, 그 문장의
// 하한을 분으로 뽑는다. 범위의 짧은 쪽을 쓰는 건, 길게 잡으면 일정 전체가 밀리기 때문이다.

const STAY_MIN_MINUTES = 10;
const STAY_MAX_MINUTES = 480;
const STAY_STEP_MINUTES = 10;
const STAY_FALLBACK_MINUTES = 60;

export function parseStayDurationMinutes(text: string | null): number | null {
  if (!text) return null;
  const first = text.split(/[~\-–]/)[0];
  const hours = first.match(/(\d+(?:\.\d+)?)\s*시간/);
  const minutes = first.match(/(\d+)\s*분/);
  if (hours || minutes) {
    return Math.round((hours ? Number(hours[1]) * 60 : 0) + (minutes ? Number(minutes[1]) : 0));
  }
  // "2~3시간"처럼 단위가 범위 뒤에만 붙은 경우 — 앞 숫자에 문장 전체의 단위를 붙인다.
  const bare = first.match(/(\d+(?:\.\d+)?)/);
  if (!bare) return null;
  if (text.includes('시간')) return Math.round(Number(bare[1]) * 60);
  if (text.includes('분')) return Math.round(Number(bare[1]));
  return null;
}

export function defaultStayMinutes(text: string | null): number {
  const parsed = parseStayDurationMinutes(text) ?? STAY_FALLBACK_MINUTES;
  const stepped = Math.round(parsed / STAY_STEP_MINUTES) * STAY_STEP_MINUTES;
  return Math.min(STAY_MAX_MINUTES, Math.max(STAY_MIN_MINUTES, stepped));
}
```

- [ ] **Step 4: 통과 확인**

Run: `bunx vitest run utils/stayDuration.test.ts`
Expected: PASS (12 tests)

- [ ] **Step 5: 화면 배선**

`screens/PrioritySelectScreen.tsx`:

1. import 추가: `import { defaultStayMinutes } from '../utils/stayDuration';`
2. `:50-51`의 `STAY_DEFAULT_MINUTES` 상수와 주석 삭제.
3. `:567-576`을 교체 — 기준값을 호출부가 넘긴다:

```ts
  // 처음 커스터마이즈를 시작할 때는 콘텐츠의 "예상 체류"(stayDuration)에서 시작한다.
  // 예전엔 60분 고정이라, 기본 2시간인 곳을 누르기만 해도 1시간으로 덮어써졌다 —
  // 한 번 정한 값은 서버 제약상 null로 되돌릴 수 없어 그대로 일정에 반영됐다.
  const handleAdjustStay = (id: string, delta: number, defaultMinutes: number) => {
    setStayMinutes((prev) => {
      const base = prev[id] ?? defaultMinutes;
      const next = Math.min(STAY_MAX_MINUTES, Math.max(STAY_MIN_MINUTES, base + delta));
      return { ...prev, [id]: next };
    });
  };
```

4. `selectedContents.map` 안 `const stay = …` 아래에 `const stayDefault = defaultStayMinutes(content.stayDuration);` 추가.
5. `handleAdjustStay(content.id, 0)` → `handleAdjustStay(content.id, 0, stayDefault)`, `-STAY_STEP_MINUTES` / `STAY_STEP_MINUTES` 두 호출에도 세 번째 인자 `stayDefault` 추가.

- [ ] **Step 6: 검증**

Run: `bunx tsc --noEmit && bun run lint && bun run test:run`
Expected: 모두 통과. 실기기: 예상 체류 "약 2~3시간"인 콘텐츠의 "기본 …"을 누르면 스테퍼가 `2시간`으로 열린다.

- [ ] **Step 7: 커밋**

```bash
git add utils/stayDuration.ts utils/stayDuration.test.ts screens/PrioritySelectScreen.tsx
git commit -m "fix(priority): 체류시간 편집 시 콘텐츠 예상 체류 대신 1시간으로 덮어쓰던 문제 수정"
```

---

### Task 2: 일차 시작 시각을 눌러서 고르기 (PR A)

**Files:**
- Create: `components/molecules/TimeSelectModal.tsx`
- Create: `utils/timeOptions.ts`
- Test: `utils/timeOptions.test.ts`
- Modify: `screens/PrioritySelectScreen.tsx:53-68, 578-586, 705-744`

**Interfaces:**
- Produces: `buildTimeOptions(min: string, max: string, stepMinutes: number): string[]` — "HH:MM" 목록(양 끝 포함).
- Produces: `<TimeSelectModal visible title options selected onSelect onClose />` — `options: string[]`, `selected: string | null`, `onSelect: (time: string) => void`.

- [ ] **Step 1: 실패하는 테스트 작성**

`utils/timeOptions.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildTimeOptions } from './timeOptions';

describe('buildTimeOptions', () => {
  it('양 끝을 포함해 간격대로 만든다', () => {
    expect(buildTimeOptions('05:00', '06:30', 30)).toEqual(['05:00', '05:30', '06:00', '06:30']);
  });

  it('일차 시작 시각 범위(05:00~18:00, 30분)는 27개', () => {
    const options = buildTimeOptions('05:00', '18:00', 30);
    expect(options).toHaveLength(27);
    expect(options[0]).toBe('05:00');
    expect(options.at(-1)).toBe('18:00');
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `bunx vitest run utils/timeOptions.test.ts`
Expected: FAIL — 모듈 없음

- [ ] **Step 3: 구현**

`utils/timeOptions.ts` (기존 `utils/tripDate.ts:77,84`의 `parseTimeToMinutes(time): number | null`과 `minutesToTimeOfDay(minutes): "HH:MM"`을 재사용한다):

```ts
import { minutesToTimeOfDay, parseTimeToMinutes } from './tripDate';

// 시간 선택 모달에 늘어놓을 "HH:MM" 목록. 서버 검증 범위를 그대로 받아 양 끝을 포함한다.
export function buildTimeOptions(min: string, max: string, stepMinutes: number): string[] {
  const start = parseTimeToMinutes(min) ?? 0;
  const end = parseTimeToMinutes(max) ?? 0;
  const options: string[] = [];
  for (let m = start; m <= end; m += stepMinutes) options.push(minutesToTimeOfDay(m));
  return options;
}
```

- [ ] **Step 4: 통과 확인**

Run: `bunx vitest run utils/timeOptions.test.ts`
Expected: PASS

- [ ] **Step 5: 모달 컴포넌트**

`components/molecules/TimeSelectModal.tsx` (오버레이·시트 스타일은 `ItineraryTitleModal.tsx`와 맞춘다):

```tsx
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import styled from 'styled-components';
import { COLORS } from '../../constants/colors';
import { FONT } from '../../constants/typography';

interface TimeSelectModalProps {
  visible: boolean;
  title: string;
  options: string[];
  selected: string | null;
  onSelect: (time: string) => void;
  onClose: () => void;
}

const Overlay = styled(TouchableOpacity)`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.4);
  justify-content: center;
  align-items: center;
  padding: 24px;
`;

const Sheet = styled(TouchableOpacity)`
  width: 100%;
  max-height: 70%;
  background-color: ${COLORS.white};
  border-radius: 20px;
  padding: 24px 20px;
`;

const Title = styled(Text)`
  font-size: 17px;
  font-family: ${FONT.bold};
  color: ${COLORS.gray900};
  margin-bottom: 16px;
`;

const Grid = styled(View)`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
`;

const Chip = styled(TouchableOpacity)<{ $active: boolean }>`
  width: 23%;
  padding-vertical: 10px;
  border-radius: 10px;
  align-items: center;
  border-width: 1px;
  border-color: ${({ $active }) => ($active ? COLORS.coral500 : COLORS.gray200)};
  background-color: ${({ $active }) => ($active ? COLORS.coral50 : COLORS.white)};
`;

const ChipLabel = styled(Text)<{ $active: boolean }>`
  font-family: ${({ $active }) => ($active ? FONT.bold : FONT.medium)};
  font-size: 14px;
  color: ${({ $active }) => ($active ? COLORS.coral700 : COLORS.gray700)};
`;

// 우선순위 화면의 "일차별 시작 시각"을 한 번에 고르는 모달. 30분 단위 ± 스테퍼로는
// 09:00 → 18:00까지 18번을 눌러야 해서, 서버 허용 범위의 시각을 격자로 늘어놓는다.
// 네이티브 시간 피커를 안 쓰는 건 OTA로 내보내기 위해서다(네이티브 모듈 추가 = 새 빌드).
export function TimeSelectModal({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: TimeSelectModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Overlay activeOpacity={1} onPress={onClose}>
        <Sheet activeOpacity={1}>
          <Title>{title}</Title>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Grid>
              {options.map((time) => {
                const active = time === selected;
                return (
                  <Chip
                    key={time}
                    $active={active}
                    onPress={() => onSelect(time)}
                    activeOpacity={0.8}
                  >
                    <ChipLabel $active={active}>{time}</ChipLabel>
                  </Chip>
                );
              })}
            </Grid>
          </ScrollView>
        </Sheet>
      </Overlay>
    </Modal>
  );
}
```

- [ ] **Step 6: 화면 배선**

`screens/PrioritySelectScreen.tsx`:

1. import: `import { TimeSelectModal } from '../components/molecules/TimeSelectModal';`, `import { buildTimeOptions } from '../utils/timeOptions';`
2. 상수 아래: `const DAY_START_OPTIONS = buildTimeOptions('05:00', '18:00', DAY_START_STEP_MINUTES);`
3. state 추가: `const [editingDay, setEditingDay] = useState<number | null>(null);`
4. `DayStartDefaultButton`의 `onPress`를 `() => setEditingDay(day)`로 변경(누르면 바로 09:00을 박지 않고 고르게 한다).
5. `<DayStartValueLabel>{value}</DayStartValueLabel>`을 탭 가능하게 감싼다:

```tsx
                    <TouchableOpacity
                      onPress={() => setEditingDay(day)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 6, bottom: 6 }}
                      accessibilityLabel={`${day}일차 시작 시각 선택`}
                    >
                      <DayStartValueLabel>{value}</DayStartValueLabel>
                    </TouchableOpacity>
```

6. `</ScrollView>` 바로 뒤(BottomBarWrap 앞)에 모달 추가:

```tsx
      <TimeSelectModal
        visible={editingDay != null}
        title={`${editingDay ?? ''}일차 시작 시각`}
        options={DAY_START_OPTIONS}
        selected={editingDay != null ? (dayStartTimes[editingDay] ?? DAY_START_DEFAULT) : null}
        onSelect={(time) => {
          if (editingDay != null) setDayStartTimes((prev) => ({ ...prev, [editingDay]: time }));
          setEditingDay(null);
        }}
        onClose={() => setEditingDay(null)}
      />
```

- [ ] **Step 7: 검증**

Run: `bunx tsc --noEmit && bun run lint && bun run test:run`
Expected: 통과. 실기기: "기본 09:00"을 누르면 모달이 열리고 09:00이 강조돼 있다. 18:00을 고르면 스테퍼가 18:00으로 바뀌고 ＋가 비활성. 값 "18:00"을 다시 누르면 모달이 다시 열린다.

- [ ] **Step 8: 커밋**

```bash
git add utils/timeOptions.ts utils/timeOptions.test.ts components/molecules/TimeSelectModal.tsx screens/PrioritySelectScreen.tsx
git commit -m "feat(priority): 일차별 시작 시각을 눌러서 바로 고를 수 있게 변경"
```

---

### Task 3: 운영시간을 항목별로 줄 나눠 보여주기 (PR B)

**Files:**
- Create: `utils/useTimeLines.ts`
- Test: `utils/useTimeLines.test.ts`
- Modify: `screens/ContentDetailScreen.tsx:300-355, 418-432, 551-567`

**Interfaces:**
- Produces: `type UseTimeLine = { kind: 'header' | 'item' | 'text' | 'note'; text: string }`
- Produces: `toUseTimeLines(raw: string): UseTimeLine[]`

- [ ] **Step 1: 실패하는 테스트 작성**

`utils/useTimeLines.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { toUseTimeLines } from './useTimeLines';

describe('toUseTimeLines', () => {
  it('[구분]·글머리표·※ 안내를 줄로 나눈다 (금오산랜드 실제 데이터)', () => {
    const raw =
      '[숙박]- 입실 14:00- 퇴실 11:00[물썰매장]10:00~17:00(입장 마감 15:00)<br>[눈썰매장]10:00~16:00(입장 마감 15:00)※ 자세한 사항은 홈페이지 참조';
    expect(toUseTimeLines(raw)).toEqual([
      { kind: 'header', text: '숙박' },
      { kind: 'item', text: '입실 14:00' },
      { kind: 'item', text: '퇴실 11:00' },
      { kind: 'header', text: '물썰매장' },
      { kind: 'text', text: '10:00~17:00(입장 마감 15:00)' },
      { kind: 'header', text: '눈썰매장' },
      { kind: 'text', text: '10:00~16:00(입장 마감 15:00)' },
      { kind: 'note', text: '※ 자세한 사항은 홈페이지 참조' },
    ]);
  });

  it('<br> 뒤 글머리표를 항목으로 만든다', () => {
    expect(toUseTimeLines('11:30~18:00<br>- 마지막 주문 17:00')).toEqual([
      { kind: 'text', text: '11:30~18:00' },
      { kind: 'item', text: '마지막 주문 17:00' },
    ]);
  });

  // 시각 범위의 하이픈은 글머리표가 아니다 — 뒤에 숫자가 오면 쪼개지 않는다.
  it('"09:00 - 18:00" 같은 시각 범위는 한 줄로 둔다', () => {
    expect(toUseTimeLines('09:00 - 18:00')).toEqual([{ kind: 'text', text: '09:00 - 18:00' }]);
    expect(toUseTimeLines('10:00-12:00')).toEqual([{ kind: 'text', text: '10:00-12:00' }]);
  });

  it('구분 없는 한 줄은 그대로', () => {
    expect(toUseTimeLines('상시 개방')).toEqual([{ kind: 'text', text: '상시 개방' }]);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `bunx vitest run utils/useTimeLines.test.ts`
Expected: FAIL — 모듈 없음

- [ ] **Step 3: 구현**

`utils/useTimeLines.ts`:

```ts
// TourAPI 운영시간(useTime)은 줄바꿈 없이 "[숙박]- 입실 14:00- 퇴실 11:00[물썰매장]10:00~…"처럼
// 붙어서 온다. 상세 화면에서 [구분] 제목 / "- " 항목 / "※" 안내를 각각 한 줄로 보여주려고
// 구분자 앞에 줄바꿈을 넣은 뒤 줄 종류를 나눈다.

export interface UseTimeLine {
  kind: 'header' | 'item' | 'text' | 'note';
  text: string;
}

export function toUseTimeLines(raw: string): UseTimeLine[] {
  const normalized = raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/\[([^\]\n]+)\]/g, '\n[$1]\n')
    // 글머리표는 "- " 뒤에 숫자가 아닌 글자가 올 때만 — "09:00 - 18:00"의 하이픈은 범위다.
    .replace(/-\s+(?=\D)/g, '\n- ')
    .replace(/※/g, '\n※');

  return normalized
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .map((line): UseTimeLine => {
      const header = line.match(/^\[(.+)\]$/);
      if (header) return { kind: 'header', text: header[1].trim() };
      if (line.startsWith('- ')) return { kind: 'item', text: line.slice(2).trim() };
      if (line.startsWith('※')) return { kind: 'note', text: line };
      return { kind: 'text', text: line };
    });
}
```

- [ ] **Step 4: 통과 확인**

Run: `bunx vitest run utils/useTimeLines.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: 화면 배선**

`screens/ContentDetailScreen.tsx`:

1. import: `import { toUseTimeLines } from '../utils/useTimeLines';`
2. `InfoTableValue` 아래에 스타일 추가:

```ts
// 운영시간 전용 — [구분] 제목은 굵게, "- " 항목은 들여쓴 점, ※ 안내는 옅게 보여준다.
const UseTimeColumn = styled(View)`
  flex: 1;
  gap: 2px;
`;

const UseTimeHeader = styled(Text)<{ $first: boolean }>`
  font-family: ${FONT.bold};
  font-size: 13px;
  line-height: 19px;
  color: ${COLORS.gray900};
  margin-top: ${({ $first }) => ($first ? 0 : 6)}px;
`;

const UseTimeText = styled(Text)<{ $muted?: boolean }>`
  font-family: ${FONT.medium};
  font-size: ${({ $muted }) => ($muted ? 12 : 13)}px;
  line-height: 19px;
  color: ${({ $muted }) => ($muted ? COLORS.gray500 : COLORS.gray900)};
`;
```

3. `infoRows.map` 안의 `<InfoTableValue>{withLineBreaks(row.value as string)}</InfoTableValue>`를 교체:

```tsx
                    {row.label === '운영시간' ? (
                      <UseTimeColumn>
                        {toUseTimeLines(row.value as string).map((line, i) =>
                          line.kind === 'header' ? (
                            // biome-ignore lint/suspicious/noArrayIndexKey: 같은 문구가 반복될 수 있는 고정 목록
                            <UseTimeHeader key={i} $first={i === 0}>
                              {line.text}
                            </UseTimeHeader>
                          ) : (
                            // biome-ignore lint/suspicious/noArrayIndexKey: 같은 문구가 반복될 수 있는 고정 목록
                            <UseTimeText key={i} $muted={line.kind === 'note'}>
                              {line.kind === 'item' ? `· ${line.text}` : line.text}
                            </UseTimeText>
                          ),
                        )}
                      </UseTimeColumn>
                    ) : (
                      <InfoTableValue>{withLineBreaks(row.value as string)}</InfoTableValue>
                    )}
```

- [ ] **Step 6: 검증**

Run: `bunx tsc --noEmit && bun run lint && bun run test:run`
Expected: 통과. 실기기: 금오산랜드 상세의 운영시간이 "숙박 / · 입실 14:00 / · 퇴실 11:00 / 물썰매장 / 10:00~17:00(…) / …"로 줄마다 나온다. 아이콘·라벨이 첫 줄(숙박)과 높이가 맞는다.

- [ ] **Step 7: 커밋**

```bash
git add utils/useTimeLines.ts utils/useTimeLines.test.ts screens/ContentDetailScreen.tsx
git commit -m "feat(content): 상세 화면 운영시간을 구분·항목별로 줄 나눠 표시"
```

---

### Task 4: 일정 카드의 주소와 설명 구분 (PR C)

**Files:**
- Modify: `screens/ItineraryResultScreen.tsx:429-442, 1130-1134`
- Modify: `screens/SavedItineraryScreen.tsx:269-282, 781-785`

테스트 없음(스타일만 변경). 실기기 확인으로 검증.

- [ ] **Step 1: 결과 화면 스타일 교체**

`screens/ItineraryResultScreen.tsx`의 `StopAddress`, `ReasonText`를 교체하고 `AddressRow`를 추가:

```ts
// 주소는 위치 아이콘을 붙인 한 줄 메타 정보, 추천 이유는 옅은 배경 상자로 분리한다 —
// 예전엔 둘 다 11px 회색 글씨라 어디까지가 주소고 어디부터가 설명인지 구분이 안 됐다.
const AddressRow = styled(View)`
  flex-direction: row;
  align-items: center;
  gap: 3px;
  margin-top: 5px;
`;

const StopAddress = styled(Text)`
  flex: 1;
  font-family: ${FONT.regular};
  font-size: 11px;
  color: ${COLORS.gray500};
`;

const ReasonText = styled(Text)`
  font-family: ${FONT.regular};
  font-size: 12px;
  line-height: 18px;
  color: ${COLORS.gray700};
  margin-top: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  background-color: ${COLORS.gray50};
  overflow: hidden;
`;
```

- [ ] **Step 2: 결과 화면 JSX 교체**

```tsx
                    {content?.address && (
                      <AddressRow>
                        <Ionicons name="location-outline" size={11} color={COLORS.gray400} />
                        <StopAddress numberOfLines={1}>{content.address}</StopAddress>
                      </AddressRow>
                    )}
                    <ReasonText>{stop.reason}</ReasonText>
```

- [ ] **Step 3: 저장 화면에 같은 변경**

`screens/SavedItineraryScreen.tsx`에 Step 1의 세 스타일(`AddressRow`, `StopAddress`, `ReasonText`)과 Step 2의 JSX를 똑같이 적용한다. 화면 배경이 `gray50`이라 상자가 묻히면 두 파일 모두 `background-color: ${COLORS.gray100}`으로 바꾼다(카드 배경색은 `StopBody`/`StopRow` 스타일에서 확인).

- [ ] **Step 4: 검증**

Run: `bunx tsc --noEmit && bun run lint`
Expected: 통과. 실기기: 결과·저장한 일정 화면 모두 주소 앞에 핀 아이콘이 붙고, 추천 이유가 옅은 상자 안에 들어가 구분된다. 긴 이유 문장도 상자 안에서 줄바꿈된다.

- [ ] **Step 5: 커밋**

```bash
git add screens/ItineraryResultScreen.tsx screens/SavedItineraryScreen.tsx
git commit -m "feat(itinerary): 일정 카드에서 주소와 추천 이유를 시각적으로 구분"
```

---

### Task 5: 일정 저장 400 원인 확정 + 서버 계약에 맞는 body (PR D)

**Files:**
- Modify: `services/itineraryService.ts:63-107`
- Test: `services/itineraryService.test.ts` (신규)
- Modify: `screens/ItineraryResultScreen.tsx:792-799`

**Interfaces:**
- Produces: `export function toSaveBody(input: SavePlanInput)` (현재 비공개 → export). `duration`은 항상 숫자.

- [ ] **Step 1: 재현으로 실패 필드 확정**

개발 빌드(`bun expo run:android`)에서 로그인 → 일정 생성 → 저장을 테스터와 같은 조건(날짜 선택 여부, AI 추천 켜짐 여부)으로 반복한다. `adb logcat | grep -E "\[apiClient\] 요청 실패|\[itinerary\] 일정 저장 실패"`로 요청 body와 서버 응답을 확인하고, 어느 필드가 계약(아래 표)을 어겼는지 PR 본문에 적는다.

| 필드 | 서버 계약 |
|---|---|
| `title` | 필수, 1자 이상 |
| `region` | 필수, `HADONG` / `YEONGJU` / `YECHEON` |
| `duration` | 필수 (일수, 1=당일) |
| `days` | 1개 이상, 각 `items` 1개 이상, `contentId` 1자 이상 |

재현이 안 되면 Step 2~5의 방어만 적용하고, PR 본문에 "원인 미확정, 계약 위반 가능 값 차단"으로 적는다.

- [ ] **Step 2: 실패하는 테스트 작성**

`services/itineraryService.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import type { ItineraryStop } from '../types/itinerary';

vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

const { toSaveBody } = await import('./itineraryService');

function stop(contentId: string, day: number): ItineraryStop {
  return {
    contentId,
    day,
    startTime: '10:00',
    endTime: '12:00',
    reason: '이유',
    addedByAi: false,
    addedForRest: false,
  };
}

const base = {
  title: '영주 여행',
  region: 'yeongju',
  travelDate: '2026-10-05',
  duration: 1,
  stops: [stop('a', 1), stop('b', 2)],
  titleByContentId: { a: '노계서원', b: '' },
};

describe('toSaveBody', () => {
  it('박 수를 서버 일수로 바꾼다', () => {
    expect(toSaveBody(base).duration).toBe(2);
  });

  // 서버는 duration을 필수로 받는다. 날짜를 안 고른 채 저장하면 박 수가 null이라
  // 예전엔 null을 보내 400(입력값을 확인해주세요)이 났다 — 일정의 일수로 채운다.
  it('박 수가 없으면 일정의 마지막 일차를 일수로 보낸다', () => {
    expect(toSaveBody({ ...base, travelDate: null, duration: null }).duration).toBe(2);
  });

  it('지역은 대문자 enum으로 보낸다', () => {
    expect(toSaveBody(base).region).toBe('YEONGJU');
  });

  it('이름을 모르는 장소는 빈 문자열 대신 title을 null로 보낸다', () => {
    const items = toSaveBody(base).days.flatMap((d) => d.items);
    expect(items.find((i) => i.contentId === 'b')?.title).toBeNull();
  });

  it('제목 앞뒤 공백을 지운다', () => {
    expect(toSaveBody({ ...base, title: '  영주 여행 ' }).title).toBe('영주 여행');
  });
});
```

- [ ] **Step 3: 실패 확인**

Run: `bunx vitest run services/itineraryService.test.ts`
Expected: FAIL — `toSaveBody`가 export되지 않음

- [ ] **Step 4: 구현**

`services/itineraryService.ts`:

`stopsToDays`의 title 매핑을 바꾼다:

```ts
        // ''는 nullish가 아니라 그대로 나가던 값 — 이름을 아직 못 불러온 장소(AI 추가)는 null로 보낸다.
        title: titleByContentId[s.contentId] || null,
```

`toSaveBody`를 export하고 duration·title을 계약에 맞춘다:

```ts
// 서버 SaveItineraryRequest 계약: title(1자 이상)·region(enum)·duration(필수)·days(1개 이상).
// 날짜를 안 고르고 만든 일정은 박 수가 null이라, 일정에 실제로 있는 마지막 일차를 일수로 쓴다.
export function toSaveBody(input: SavePlanInput) {
  const lastDay = Math.max(1, ...input.stops.map((s) => s.day));
  return {
    title: input.title.trim(),
    region: input.region.toUpperCase(),
    travelDate: input.travelDate,
    duration: nightsToApiDuration(input.duration) ?? lastDay,
    days: stopsToDays(input.stops, input.titleByContentId),
  };
}
```

- [ ] **Step 5: 통과 확인**

Run: `bunx vitest run services/itineraryService.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 6: 지역 빈 값 방어**

`screens/ItineraryResultScreen.tsx:794`를 교체:

```ts
        // 지역이 비면 ''.toUpperCase()가 나가 서버 enum 검증에서 400이 난다 — 일정의 첫 장소 지역으로 채운다.
        region: plan?.region ?? selectedRegions[0] ?? contentById[stops[0]?.contentId]?.regionId ?? '',
```

`contentById`가 `submitSave`보다 아래에서 선언돼 있으면(현재 `:870` 부근) 이 참조는 클로저 실행 시점엔 유효하다. 타입 오류가 나면 `submitSave`를 `contentById` 선언 아래로 옮긴다.

- [ ] **Step 7: 검증**

Run: `bunx tsc --noEmit && bun run lint && bun run test:run`
Expected: 통과. 실기기: Step 1에서 재현한 조건으로 저장이 성공한다.

- [ ] **Step 8: 커밋**

```bash
git add services/itineraryService.ts services/itineraryService.test.ts screens/ItineraryResultScreen.tsx
git commit -m "fix(itinerary): 일정 저장 요청을 서버 필수값 계약에 맞춰 400 방지"
```

---

### Task 6: 일정 저장 후 바구니 비우기 (PR D)

**Files:**
- Modify: `navigation/RootNavigator.tsx` (`ItineraryGate`, 약 180-216행)

- [ ] **Step 1: 배선**

`ItineraryGate`의 `useAppState()` 구조분해에 `clearItems`를 추가하고, `onGoHome`을 교체:

```tsx
      // onGoHome은 저장에 성공했을 때만 불린다(ItineraryResultScreen.handleConfirmSave).
      // 바구니는 이번 일정을 만들려고 담은 것이라, 저장이 끝나면 비워야 다음 여행을
      // 빈 바구니에서 시작한다. 서버 바구니는 다음 일정 생성 전 syncBasketToServer가 맞춘다.
      onGoHome={() => {
        clearItems();
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      }}
```

`clearItems`가 `useAppState()`에 노출돼 있는지 `contexts/AppStateContext.tsx:287`에서 확인한다(노출돼 있음).

- [ ] **Step 2: 검증**

Run: `bunx tsc --noEmit && bun run lint`
Expected: 통과. 실기기: 바구니에 3곳 담기 → 일정 생성 → 저장 → 홈으로 이동 → 바구니 탭이 비어 있다. 저장 실패 시(비행기 모드)에는 바구니가 그대로다. 저장한 일정 화면에서 편집 저장은 바구니에 영향이 없다.

- [ ] **Step 3: 커밋**

```bash
git add navigation/RootNavigator.tsx
git commit -m "fix(basket): 일정 저장에 성공하면 여행 바구니를 비움"
```

---

### Task 7: 콘텐츠 목록 20개씩 + 가상화 (PR E)

**Files:**
- Modify: `services/contentService.ts:51-98`
- Test: `services/contentService.test.ts` (신규)
- Modify: `screens/ContentExploreScreen.tsx:249-301` (+ 사용 안 하게 되는 `LoadMoreButton`, `LoadMoreLabel`, `CardList` 스타일 삭제)

**Interfaces:**
- Produces: `fetchContents(regionIds: string[], page: number): Promise<ContentPage>` — 시그니처 그대로, 한 페이지 합계가 약 20개.

- [ ] **Step 1: 실패하는 테스트 작성**

`services/contentService.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
vi.mock('./apiClient', () => ({ apiClient: { get } }));

const { fetchContents } = await import('./contentService');

function page(totalCount: number, size: number) {
  return { data: { totalCount, page: 0, size, items: [] } };
}

describe('fetchContents', () => {
  beforeEach(() => get.mockReset());

  it('지역 하나면 20개씩 요청한다', async () => {
    get.mockResolvedValue(page(100, 20));
    await fetchContents(['hadong'], 0);
    expect(get).toHaveBeenCalledWith('/contents', {
      params: { region: 'HADONG', page: 0, size: 20 },
    });
  });

  // 지역마다 20개씩 받으면 3개 지역 선택 시 한 번에 60개를 그린다 — 합계가 20개 남짓이 되게 나눈다.
  it('지역 3개면 지역당 7개씩 요청한다', async () => {
    get.mockResolvedValue(page(100, 7));
    await fetchContents(['hadong', 'yeongju', 'yecheon'], 0);
    for (const call of get.mock.calls) expect(call[1].params.size).toBe(7);
  });

  it('hasMore는 지역별 크기로 계산한다', async () => {
    get.mockResolvedValue(page(14, 7));
    expect((await fetchContents(['hadong', 'yeongju', 'yecheon'], 0)).hasMore).toBe(true);
    expect((await fetchContents(['hadong', 'yeongju', 'yecheon'], 1)).hasMore).toBe(false);
  });
});
```

`contentService.ts`는 `constants/contentImageOverrides`(순수 데이터)와 `./apiClient`만 import하므로 `./apiClient` mock 하나로 충분하다.

- [ ] **Step 2: 실패 확인**

Run: `bunx vitest run services/contentService.test.ts`
Expected: FAIL — 지역 3개 케이스에서 size가 20

- [ ] **Step 3: 구현**

`services/contentService.ts`:

```ts
// 탐색 화면 한 번에 그리는 개수. 지역 여러 개를 고르면 지역마다 나눠 받아 합계를 맞춘다 —
// 지역당 20개면 3개 지역에서 60개를 한꺼번에 그려 첫 화면과 이미지 로딩이 느려졌다.
const PAGE_SIZE = 20;

async function fetchContentsPage(
  regionId: string,
  page: number,
  size: number,
): Promise<{ items: Content[]; totalCount: number }> {
  const { data } = await apiClient.get<ContentListResponse>('/contents', {
    params: { region: regionId.toUpperCase(), page, size },
  });
  return { items: data.items.map(toContent), totalCount: data.totalCount };
}

export async function fetchContents(regionIds: string[], page: number): Promise<ContentPage> {
  const size = Math.ceil(PAGE_SIZE / Math.max(1, regionIds.length));
  const results = await Promise.all(
    regionIds.map((regionId) => fetchContentsPage(regionId, page, size)),
  );
  return {
    items: results.flatMap((r) => r.items),
    hasMore: results.some((r) => (page + 1) * size < r.totalCount),
  };
}
```

- [ ] **Step 4: 통과 확인**

Run: `bunx vitest run services/contentService.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: 탐색 목록을 FlatList로**

`screens/ContentExploreScreen.tsx`:

1. `react-native` import에 `FlatList` 추가, `ScrollView`가 더 안 쓰이면 제거.
2. `<ScrollView …> … </ScrollView>` 전체(약 249-301행)를 교체:

```tsx
      {/* ScrollView + map은 담긴 카드를 전부 한 번에 그려, 페이지가 쌓일수록 느려졌다.
          FlatList는 화면 근처 카드만 그리고, 끝에 닿으면 다음 페이지를 자동으로 부른다. */}
      <FlatList
        data={isLoading || isError ? [] : filtered}
        keyExtractor={(content) => content.id}
        renderItem={({ item: content }) => (
          <ContentCard
            content={content}
            selected={selectedIds.includes(content.id)}
            onPress={() => onPressDetail(content.id)}
            onPressDetail={() => onPressDetail(content.id)}
            favorite={favoriteIds.includes(content.id)}
            onToggleFavorite={onToggleFavorite}
            onToggleBasket={onToggle}
            showRegion
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ gap: 12 }}>
              {Array.from({ length: SKELETON_COUNT }, (_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: 로딩 중 고정 개수의 자리표시자라 인덱스 키로 충분
                <ContentCardSkeleton key={i} />
              ))}
            </View>
          ) : isError ? (
            <CenterBox>
              <EmptyText>컨텐츠를 불러오지 못했습니다. 다시 시도해주세요.</EmptyText>
              <RetryButton onPress={() => refetch()} activeOpacity={0.8}>
                <RetryLabel>다시 시도</RetryLabel>
              </RetryButton>
            </CenterBox>
          ) : (
            <CenterBox>
              <EmptyText>조건에 맞는 콘텐츠가 없어요</EmptyText>
            </CenterBox>
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <FooterLoading>
              <ActivityIndicator color={COLORS.coral500} />
            </FooterLoading>
          ) : null
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.6}
        initialNumToRender={6}
        windowSize={7}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: selectedIds.length > 0 ? 120 + TAB_BAR_TOTAL : 40 + TAB_BAR_CLEARANCE,
        }}
      />
```

기존 `ScrollView`/`CardList`에 가로 패딩이 있었다면(`ScreenContainer`나 `CardList` 스타일 확인) `contentContainerStyle`에 같은 `paddingHorizontal`을 넣는다.

3. 안 쓰게 된 `CardList`, `LoadMoreButton`, `LoadMoreLabel` 스타일 삭제.

- [ ] **Step 6: 검증**

Run: `bunx tsc --noEmit && bun run lint && bun run test:run`
Expected: 통과. 실기기:
- 지역 3개 선택 시 첫 화면 카드가 21개 이하(`adb logcat`의 `[apiClient]` 요청 로그에서 `size=7` 확인).
- 끝까지 스크롤하면 로딩 표시 후 다음 카드가 붙고, "더보기" 버튼은 없다.
- 검색어로 결과가 줄어 화면이 안 차도 다음 페이지를 계속 부르며 멈추지 않는다(`onEndReached` 반복 호출이 `hasNextPage`가 false가 되면 끝남).

- [ ] **Step 7: 커밋**

```bash
git add services/contentService.ts services/contentService.test.ts screens/ContentExploreScreen.tsx
git commit -m "perf(content): 탐색 목록을 20개씩 받아 FlatList로 그리도록 변경"
```

---

### Task 8: 이미지 캐시 (expo-image) — 별도 PR, 사용자 승인 필요

**네이티브 의존성 추가라 OTA로 못 나간다.** `app.json` `version`을 `1.0.2`로 올리고 새 EAS 빌드를 내야 하며, 1.0.1 설치본은 이후 OTA를 못 받는다(런타임 분리). Task 7 배포 후에도 이미지가 느리다는 피드백이 이어질 때 진행한다.

**Files:**
- Modify: `package.json` (`bunx expo install expo-image`)
- Modify: `app.json` (`"version": "1.0.2"`)
- Modify: `components/molecules/ContentCard.tsx:2, 42, 196`, `NearbyContentCard.tsx:73`, `SavedTripCard.tsx:140`, `screens/HomeContent.tsx:732, 777, 842`, `screens/ContentDetailScreen.tsx:505`

- [ ] **Step 1: 설치와 버전**

```bash
bunx expo install expo-image
```

`app.json`의 `"version": "1.0.1"` → `"1.0.2"`.

- [ ] **Step 2: 이미지 교체**

각 파일에서 `Image`(react-native)를 쓰는 styled 컴포넌트를 `expo-image`의 `Image`로 바꾸고, `resizeMode="cover"` → `contentFit="cover"`, 그리고 `cachePolicy="memory-disk"`, `transition={150}`, 목록 카드에는 `recyclingKey={content.id}`를 준다. 예(`ContentCard.tsx`):

```tsx
import { Image } from 'expo-image';
// ...
const ThumbnailImage = styled(Image)`
  width: 100%;
  height: 100%;
`;
// ...
<ThumbnailImage
  source={{ uri: content.imageUrl }}
  contentFit="cover"
  cachePolicy="memory-disk"
  recyclingKey={content.id}
  transition={150}
/>
```

- [ ] **Step 3: 검증**

Run: `bunx tsc --noEmit && bun run lint && bun run test:run`, 그리고 `bun expo run:android`로 새 네이티브 빌드에서 확인.
Expected: 탐색 목록을 내렸다 다시 올리면 이미지가 즉시 뜬다(디스크 캐시). 앱 재시작 후에도 즉시 뜬다.

- [ ] **Step 4: 커밋**

```bash
git add package.json bun.lock app.json components screens
git commit -m "perf(image): expo-image로 콘텐츠 이미지 디스크 캐시 적용 (1.0.2)"
```

---

### Task 9: 공유를 웹 링크 카드로 (PR F)

**Files:**
- Modify: `services/shareService.ts:1-13`
- Modify: `services/shareItinerary.ts`
- Delete: `services/shareItineraryText.ts`, `services/shareItineraryText.test.ts`
- Modify: `screens/ItineraryResultScreen.tsx:842-863`, `screens/SavedItineraryScreen.tsx:503-516`, `hooks/useItineraryShare.ts:345-349`
- Test: `services/shareService.test.ts` (신규)

**Interfaces:**
- Produces: `buildShareUrl(token: string): string` → `https://www.pick-trip.app/share/<token>`
- Produces: `shareItinerary(title: string, url: string): Promise<void>`

- [ ] **Step 1: 실패하는 테스트 작성**

`services/shareService.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';

vi.mock('./apiClient', () => ({ apiClient: { post: vi.fn(), get: vi.fn() } }));

const { buildShareUrl } = await import('./shareService');

describe('buildShareUrl', () => {
  // picktrip:// 커스텀 스킴은 카카오톡 등에서 링크로 안 눌리고 미리보기도 안 나온다.
  // 웹 공유 페이지(pick-trip-client /share/[id])는 OG 카드와 일정 UI가 이미 있다.
  it('웹 공유 페이지 주소를 만든다', () => {
    expect(buildShareUrl('abc123')).toBe('https://www.pick-trip.app/share/abc123');
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `bunx vitest run services/shareService.test.ts`
Expected: FAIL — `buildShareUrl` 없음

- [ ] **Step 3: 구현**

`services/shareService.ts` 상단 교체:

```ts
import { WEB_BASE_URL } from '../constants/api';
import type { ItineraryStop } from '../types/itinerary';
import { apiDurationToNights } from '../utils/tripDate';
import { apiClient } from './apiClient';

interface ShareCreateResponse {
  token: string;
}

// 공유는 웹 공유 페이지로 보낸다. 메신저가 OG 미리보기 카드(제목·지역·일정 요약)를 띄우고,
// 누르면 앱 설치 여부와 무관하게 일정 UI가 열린다 — picktrip:// 스킴은 메신저에서 링크가 안 된다.
export function buildShareUrl(token: string): string {
  return `${WEB_BASE_URL}/share/${token}`;
}

export async function createShareLink(itineraryId: string): Promise<string> {
  const { data } = await apiClient.post<ShareCreateResponse>(`/itineraries/${itineraryId}/share`);
  return buildShareUrl(data.token);
}
```

`expo-linking` import는 이 파일에서 더 안 쓰이면 삭제한다.

`services/shareItinerary.ts` 전체 교체:

```ts
import { Share } from 'react-native';

// 일정 목록을 글로 풀어 보내던 방식 대신, 제목 + 웹 링크만 보낸다. 메신저가 링크를
// 미리보기 카드로 바꿔 보여주고, 상세 일정은 링크 너머 웹 페이지가 UI로 보여준다.
export async function shareItinerary(title: string, url: string): Promise<void> {
  try {
    await Share.share({ title, message: `[PickTrip] ${title}\n${url}` });
  } catch {
    // 공유 시트 취소/드문 네이티브 오류 — 사용자에게 별도 알릴 필요 없음
  }
}
```

- [ ] **Step 4: 호출부 교체**

`screens/ItineraryResultScreen.tsx` `handleShare` 안:

```ts
      const link = await createShareLink(itineraryId);
      await shareItinerary(plan?.title ?? initialItineraryTitle ?? '나만의 여행 일정', link);
```

`screens/SavedItineraryScreen.tsx` `handleShare` 안(일정 제목 변수명은 그 화면의 `plan?.title`을 쓴다):

```ts
      const link = await createShareLink(itineraryId);
      await shareItinerary(plan?.title ?? '나만의 여행 일정', link);
```

`hooks/useItineraryShare.ts:345-349`의 `` `${item.title}\n\n일정 보기: ${link}` ``로 메시지를 만드는 부분을 `await shareItinerary(item.title, link);`로 바꾼다.

세 파일에서 `buildShareText` import를 지우고, `services/shareItineraryText.ts`와 그 테스트를 삭제한다:

```bash
git rm services/shareItineraryText.ts services/shareItineraryText.test.ts
```

`grep -rn "buildShareText\|shareItineraryText" --include=*.ts --include=*.tsx .`(node_modules 제외)로 남은 참조가 없는지 확인한다.

- [ ] **Step 5: 통과 확인과 미리보기 확인**

Run: `bunx vitest run services/shareService.test.ts && bunx tsc --noEmit && bun run lint && bun run test:run`
Expected: 통과.

카카오 공유 디버거(https://developers.kakao.com/tool/debugger/sharing)에 `https://www.pick-trip.app/share/f1290aacbd3f45738ef944165a876d7a`를 넣어 미리보기가 뜨는지 확인한다. **안 뜨면** 원인은 웹 `robots.txt`의 `Disallow: /share`일 가능성이 크다 — pick-trip-client 레포에 "`/share`를 robots Disallow에서 빼거나 카카오 스크랩 봇(`kakaotalk-scrap`)만 허용" 이슈를 만들고 PR 본문에 링크한다(앱 쪽 변경은 그대로 진행).

실기기: 저장한 일정에서 공유 → 카카오톡으로 보내면 "[PickTrip] 제목" + 링크 카드가 나오고, 누르면 웹 공유 페이지가 열린다.

- [ ] **Step 6: 커밋**

```bash
git add services/shareService.ts services/shareService.test.ts services/shareItinerary.ts screens/ItineraryResultScreen.tsx screens/SavedItineraryScreen.tsx hooks/useItineraryShare.ts
git commit -m "feat(share): 일정 공유를 텍스트 대신 웹 공유 페이지 링크 카드로 변경"
```

---

### Task 10: 장소 추가를 별도 화면으로 (PR G)

**Files:**
- Create: `services/addPlaceBridge.ts`
- Test: `services/addPlaceBridge.test.ts`
- Create: `screens/AddPlaceScreen.tsx`
- Modify: `types/navigation.ts` (`AddPlace` 추가)
- Modify: `navigation/RootNavigator.tsx` (`AddPlaceGate`, `Stack.Screen`, `ItineraryGate`·`SavedItineraryGate`에 `onOpenAddPlace` 전달)
- Modify: `screens/ItineraryResultScreen.tsx` (props, `:629` state, `:885-886`, `:1193-1207`, `CandidateRow`·`CandidateName` 스타일 삭제)
- Modify: `screens/SavedItineraryScreen.tsx` (같은 부분, `:447`, `:484`, `:839-856`)

**Interfaces:**
- Produces: `setAddPlaceHandler(handler: (contentId: string) => void): void`, `consumeAddPlace(contentId: string): void`
- Produces: `RootStackParamList['AddPlace'] = { regionIds: string[]; excludeIds: string[] }`
- Produces: 두 화면의 새 prop `onOpenAddPlace: (params: { regionIds: string[]; excludeIds: string[] }) => void`

- [ ] **Step 1: 실패하는 테스트 작성**

`services/addPlaceBridge.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { consumeAddPlace, setAddPlaceHandler } from './addPlaceBridge';

describe('addPlaceBridge', () => {
  it('등록한 핸들러에 고른 장소를 넘긴다', () => {
    const handler = vi.fn();
    setAddPlaceHandler(handler);
    consumeAddPlace('c1');
    expect(handler).toHaveBeenCalledWith('c1');
  });

  // 한 번 고르면 끝 — 뒤로 갔다 다시 들어온 화면에서 이전 핸들러가 또 불리면 안 된다.
  it('한 번 쓰면 비운다', () => {
    const handler = vi.fn();
    setAddPlaceHandler(handler);
    consumeAddPlace('c1');
    consumeAddPlace('c2');
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `bunx vitest run services/addPlaceBridge.test.ts`
Expected: FAIL — 모듈 없음

- [ ] **Step 3: 구현**

`services/addPlaceBridge.ts`:

```ts
// 장소 추가 화면(AddPlaceScreen)에서 고른 장소를, 그 화면을 연 일정 화면의 로컬 stops에
// 넣기 위한 통로. 라우트 params에 콜백을 넣으면 직렬화 경고가 나고, 일정 화면의 stops는
// 로컬 state라 전역 상태로 옮기기엔 범위가 커서 모듈 변수 하나로 잇는다.
// ponytail: 핸들러 하나만 보관 — 장소 추가 화면은 동시에 하나만 열린다. 앱이 백그라운드에서
// 종료 후 상태 복원되면 핸들러가 사라져 선택이 무시된다(화면만 닫힘). 그게 문제되면 AppStateContext로 옮긴다.
let pending: ((contentId: string) => void) | null = null;

export function setAddPlaceHandler(handler: (contentId: string) => void): void {
  pending = handler;
}

export function consumeAddPlace(contentId: string): void {
  const handler = pending;
  pending = null;
  handler?.(contentId);
}
```

- [ ] **Step 4: 통과 확인**

Run: `bunx vitest run services/addPlaceBridge.test.ts`
Expected: PASS

- [ ] **Step 5: 라우트 타입과 화면**

`types/navigation.ts`의 `RootStackParamList`에 추가:

```ts
  AddPlace: { regionIds: string[]; excludeIds: string[] };
```

`screens/AddPlaceScreen.tsx`:

```tsx
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components';
import { CategoryFilter } from '../components/molecules/CategoryFilter';
import { CATEGORIES } from '../constants/categories';
import { COLORS } from '../constants/colors';
import { FONT } from '../constants/typography';
import { useContents } from '../hooks/useContents';
import type { ContentCategory } from '../types/content';

interface AddPlaceScreenProps {
  regionIds: string[];
  excludeIds: string[];
  onSelect: (contentId: string) => void;
}

const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: ${COLORS.white};
`;

const SearchBox = styled(View)`
  flex-direction: row;
  align-items: center;
  gap: 8px;
  margin: 12px 20px 8px;
  padding: 10px 14px;
  border-radius: 12px;
  background-color: ${COLORS.gray50};
`;

const SearchInput = styled(TextInput)`
  flex: 1;
  font-family: ${FONT.regular};
  font-size: 14px;
  color: ${COLORS.gray900};
  padding: 0;
`;

const Row = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
`;

const Thumb = styled(Image)`
  width: 56px;
  height: 56px;
  border-radius: 10px;
  background-color: ${COLORS.gray100};
`;

const RowText = styled(View)`
  flex: 1;
`;

const Name = styled(Text)`
  font-family: ${FONT.bold};
  font-size: 15px;
  color: ${COLORS.gray900};
`;

const Meta = styled(Text)`
  font-family: ${FONT.regular};
  font-size: 12px;
  color: ${COLORS.gray500};
  margin-top: 3px;
`;

const Empty = styled(Text)`
  font-family: ${FONT.regular};
  font-size: 14px;
  color: ${COLORS.gray500};
  text-align: center;
  margin-top: 60px;
`;

// 일정 화면의 "+ 장소 추가"가 여는 화면. 예전엔 일정 아래에 이름만 있는 긴 목록이
// 펼쳐졌는데, 지역 첫 페이지 20개뿐이고 검색·사진이 없어 고르기 어려웠다 — 검색·카테고리
// 필터·사진이 있는 별도 화면에서 끝까지 스크롤하며 고르게 한다.
export function AddPlaceScreen({ regionIds, excludeIds, onSelect }: AddPlaceScreenProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ContentCategory | 'all'>('all');
  const { contents, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useContents(regionIds);

  const candidates = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return contents.filter(
      (c) =>
        !excludeIds.includes(c.id) &&
        (category === 'all' || c.category === category) &&
        (keyword === '' ||
          c.name.toLowerCase().includes(keyword) ||
          c.address.toLowerCase().includes(keyword)),
    );
  }, [contents, excludeIds, category, query]);

  return (
    <Container edges={['bottom', 'left', 'right']}>
      <SearchBox>
        <Ionicons name="search-outline" size={16} color={COLORS.gray400} />
        <SearchInput
          value={query}
          onChangeText={setQuery}
          placeholder="장소 이름이나 주소로 검색"
          returnKeyType="search"
        />
      </SearchBox>
      <CategoryFilter selected={category} onSelect={setCategory} />
      <FlatList
        data={candidates}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <Row onPress={() => onSelect(item.id)} activeOpacity={0.7}>
            <Thumb source={item.imageUrl ? { uri: item.imageUrl } : undefined} />
            <RowText>
              <Name numberOfLines={1}>{item.name}</Name>
              <Meta numberOfLines={1}>
                {CATEGORIES.find((cat) => cat.id === item.category)?.label ?? item.category} ·{' '}
                {item.address}
              </Meta>
            </RowText>
            <Ionicons name="add-circle-outline" size={22} color={COLORS.coral500} />
          </Row>
        )}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator style={{ marginTop: 60 }} color={COLORS.coral500} />
          ) : (
            <Empty>추가할 수 있는 장소가 없어요</Empty>
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator style={{ marginVertical: 16 }} color={COLORS.coral500} />
          ) : null
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.6}
        keyboardShouldPersistTaps="handled"
      />
    </Container>
  );
}
```

`CategoryFilter`가 가로 패딩을 자체로 갖지 않으면 `<View style={{ paddingHorizontal: 20 }}>`로 감싼다(`ContentExploreScreen`의 `FilterRow` 스타일 참고).

- [ ] **Step 6: 네비게이터 배선**

`navigation/RootNavigator.tsx`:

1. import: `import { AddPlaceScreen } from '../screens/AddPlaceScreen';`, `import { consumeAddPlace } from '../services/addPlaceBridge';`
2. Gate 추가:

```tsx
function AddPlaceGate({ route }: { route: { params: RootStackParamList['AddPlace'] } }) {
  const navigation = useNavigation<Nav>();
  return (
    <AddPlaceScreen
      regionIds={route.params.regionIds}
      excludeIds={route.params.excludeIds}
      onSelect={(contentId) => {
        consumeAddPlace(contentId);
        navigation.goBack();
      }}
    />
  );
}
```

3. `Stack.Navigator` 안 `ContentDetail` 근처에: `<Stack.Screen name="AddPlace" component={AddPlaceGate} options={{ title: '장소 추가' }} />`
4. `ItineraryGate`와 `SavedItineraryGate`가 렌더하는 화면에 prop 추가: `onOpenAddPlace={(params) => navigation.navigate('AddPlace', params)}` (`SavedItineraryGate`에 `navigation`이 없으면 `const navigation = useNavigation<Nav>();` 추가).

- [ ] **Step 7: 일정 화면 두 곳 교체**

`screens/ItineraryResultScreen.tsx`:

1. props 인터페이스에 `onOpenAddPlace: (params: { regionIds: string[]; excludeIds: string[] }) => void;` 추가, 구조분해에도 추가.
2. import: `import { setAddPlaceHandler } from '../services/addPlaceBridge';`
3. `:629` `isAddingPlace` state 삭제, `:886` `candidates` 삭제(`usedIds`는 남김).
4. `:1193-1207`을 교체:

```tsx
        <AddButton
          onPress={() => {
            // 고른 장소는 지금 보고 있는 일차에 넣는다 — 화면을 연 시점의 activeDay를 묶어둔다.
            const day = activeDay;
            setAddPlaceHandler((contentId) => setStops((prev) => addStop(prev, contentId, day)));
            onOpenAddPlace({ regionIds: selectedRegions, excludeIds: usedIds });
          }}
        >
          <AddButtonLabel>+ 장소 추가</AddButtonLabel>
        </AddButton>
```

5. `CandidateRow`, `CandidateName` 스타일 삭제.

`screens/SavedItineraryScreen.tsx`도 같은 방식으로: prop 추가, `:447` state와 `:484` `candidates` 삭제, `:839-856`을 `isEditing &&` 안의 `AddButton` 하나로 교체(`regionIds: plan ? [plan.region] : []`, `excludeIds: stopIds`), `handleStartEdit` 등에서 `setIsAddingPlace(false)` 호출 삭제, 스타일 삭제.

`grep -n "isAddingPlace\|candidates\|CandidateRow" screens/ItineraryResultScreen.tsx screens/SavedItineraryScreen.tsx`로 남은 참조가 없는지 확인한다.

- [ ] **Step 8: 검증**

Run: `bunx tsc --noEmit && bun run lint && bun run test:run`
Expected: 통과. 실기기:
- 결과 화면 2일차 탭에서 "+ 장소 추가" → 장소 추가 화면(헤더 "장소 추가", 뒤로가기) → 검색·카테고리로 좁혀서 고르면 결과 화면으로 돌아오고 2일차 끝에 추가돼 있다.
- 이미 일정에 있는 장소는 목록에 없다.
- 고르지 않고 뒤로가기하면 일정이 바뀌지 않는다.
- 저장한 일정 화면의 편집 모드에서도 같은 동작, 추가 후 "변경사항 저장"으로 저장된다.

- [ ] **Step 9: 커밋**

```bash
git add services/addPlaceBridge.ts services/addPlaceBridge.test.ts screens/AddPlaceScreen.tsx types/navigation.ts navigation/RootNavigator.tsx screens/ItineraryResultScreen.tsx screens/SavedItineraryScreen.tsx
git commit -m "feat(itinerary): 장소 추가를 인라인 목록 대신 검색 가능한 별도 화면으로 변경"
```

---

## 마무리 (각 PR 공통)

- [ ] `graphify update .` (CLAUDE.md 규칙)
- [ ] 푸시 → PR(`.github/pull_request_template.md` 형식, 테스트 플랜에 실기기 확인 결과). 머지는 사용자가 한다.
- [ ] 머지 = production OTA이므로 PR마다 테스터에게 "앱 두 번 재시작" 안내.
