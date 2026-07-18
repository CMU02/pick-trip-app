# 일정 수정 기능 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Context:** MVP 핵심 기능(mvp-scope.md) "일정 수정 - 장소 순서 변경, 삭제, 대체 장소 추가 가능"을 구현한다. key-features.md에는 특정 장소 고정/전체 재생성/하루 단위 재생성까지 나오지만, 이번 계획은 MVP 최소 범위(순서 변경/삭제/대체 장소 추가) 3가지만 다룬다 (사용자 확인 완료). 이 기능은 `feat/20`(#20, AI 일정 생성 mock)에서 만든 `ItineraryResultScreen`을 정적 결과 화면에서 편집 가능한 화면으로 바꾸는 작업이다.

**Goal:** `ItineraryResultScreen`에서 생성된 일정을 사용자가 직접 (1) 같은 날 안에서 순서를 위/아래로 바꾸고, (2) 특정 장소를 삭제하고, (3) 아직 안 담은 같은 지역 콘텐츠를 대체/추가 장소로 넣을 수 있게 한다.

**Architecture:**
- 지금 `itinerary`는 `useMemo`로 매번 다시 계산되는 파생값이라 편집이 불가능하다. 이를 `useState<ItineraryStop[]>`로 바꿔 "생성 시점에 한 번만 계산되는 초기값"으로 삼고, 이후 편집 액션은 이 state를 직접 갱신한다.
- 순서/삭제/추가 후에는 각 날짜별로 시간을 다시 채워야 하므로(10:00부터 2시간 간격, `generateItinerary`와 동일 규칙), 이 "재계산" 로직을 `services/scheduleActions.ts`에 순수 함수로 분리해서 화면과 테스트에서 재사용한다.
- 대체 장소 후보는 `selectedRegions` 기준으로 `CONTENTS`에서 이미 일정에 들어간 것을 제외하고 고른다 — `ItineraryResultScreen`에 `selectedRegions` prop을 새로 추가해야 한다 (지금은 `selectedIds`, `priorities`만 받음).
- 드래그 앤 드롭 없이 위/아래 화살표 버튼으로 순서를 바꾼다 (사용자 확인 완료 — 새 의존성 불필요).

**Tech Stack:** React Native 0.81.5, Expo ~54, styled-components ^6.4.1, TypeScript ~5.9.2

## Global Constraints

- 패키지 매니저: Bun (npm/yarn 사용 금지)
- 스타일: styled-components + COLORS 상수, transient prop `$` 접두사
- 모든 컴포넌트/함수는 named export
- **이 계획은 `feat/20`이 아닌 새 브랜치(이슈 생성 후 `feat/<이슈번호>`)에서, `feat/20`의 현재 워크트리 상태를 이어받아 실행한다**
- 특정 장소 고정, 전체/하루 단위 재생성은 이번 범위 밖 (별도 이슈)

---

## 생성/수정 파일

| 파일 | 작업 |
|------|------|
| `services/scheduleActions.ts` | 신규 — `moveStop`, `removeStop`, `addStop` + 시간 재계산 순수 함수 |
| `screens/ItineraryResultScreen.tsx` | 수정 — 편집 가능한 state로 전환, 위/아래·삭제·추가 UI |
| `App.tsx` | 수정 — `ItineraryResultScreen`에 `selectedRegions` prop 전달 |

---

## Task 1: 편집 액션 서비스 (`services/scheduleActions.ts`)

**Files:** Create `services/scheduleActions.ts`

- [ ] **Step 1: 함수 구현**

```ts
import type { ItineraryStop } from '../types/itinerary';

function recalculateTimes(stops: ItineraryStop[]): ItineraryStop[] {
  const dayGroups = new Map<number, ItineraryStop[]>();
  for (const stop of stops) {
    const group = dayGroups.get(stop.day) ?? [];
    group.push(stop);
    dayGroups.set(stop.day, group);
  }

  const result: ItineraryStop[] = [];
  for (const [, group] of dayGroups) {
    group.forEach((stop, index) => {
      const startHour = 10 + index * 2;
      result.push({
        ...stop,
        startTime: `${String(startHour).padStart(2, '0')}:00`,
        endTime: `${String(startHour + 2).padStart(2, '0')}:00`,
      });
    });
  }
  return result;
}

export function moveStop(
  stops: ItineraryStop[],
  contentId: string,
  direction: 'up' | 'down',
): ItineraryStop[] {
  const dayStops = stops.filter((s) => s.day === stops.find((x) => x.contentId === contentId)?.day);
  const index = dayStops.findIndex((s) => s.contentId === contentId);
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (index === -1 || targetIndex < 0 || targetIndex >= dayStops.length) return stops;

  const reordered = [...dayStops];
  [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];

  const otherDayStops = stops.filter((s) => s.contentId !== contentId && !dayStops.includes(s));
  return recalculateTimes([...otherDayStops, ...reordered].sort((a, b) => a.day - b.day));
}

export function removeStop(stops: ItineraryStop[], contentId: string): ItineraryStop[] {
  return recalculateTimes(stops.filter((s) => s.contentId !== contentId));
}

export function addStop(stops: ItineraryStop[], contentId: string, day: number): ItineraryStop[] {
  const newStop: ItineraryStop = {
    contentId,
    day,
    startTime: '00:00',
    endTime: '00:00',
    reason: '직접 추가한 장소입니다.',
  };
  return recalculateTimes([...stops, newStop]);
}
```

> `moveStop`의 정렬 로직은 "같은 날 스탑끼리 순서만 바꾸고 나머지 날은 그대로 이어붙인 뒤 day 기준 정렬 + 시간 재계산"으로 단순화했다 — 날짜가 2개뿐인 MVP 범위에서는 충분하다.

- [ ] **Step 2: 타입 검사** — `bunx tsc --noEmit`
- [ ] **Step 3: 유닛 테스트** (`services/scheduleActions.test.ts`)
  - "moveStop으로 같은 날 안에서 순서를 앞으로 당기면 시간이 재계산된다"
  - "날의 첫 번째 스탑을 위로 옮기면 원래 배열이 그대로 반환된다" (경계 조건)
  - "removeStop은 해당 스탑을 제거하고 남은 스탑의 시간을 다시 채운다"
  - "addStop은 지정한 날짜 끝에 스탑을 추가한다"
  - `bun run test:run`으로 통과 확인

---

## Task 2: ItineraryResultScreen 편집 UI

**Files:** Modify `screens/ItineraryResultScreen.tsx`

- [ ] **Step 1: `itinerary`를 `useMemo` 대신 `useState<ItineraryStop[]>`로 전환**

```tsx
const [stops, setStops] = useState<ItineraryStop[]>(
  () => generateItinerary({ selectedIds, priorities }).stops,
);
```

- [ ] **Step 2: 각 `StopCard`에 위/아래 화살표 + 삭제 버튼 추가**

```tsx
<StopCard key={stop.contentId}>
  <StopTime>{stop.startTime} - {stop.endTime}</StopTime>
  <StopName>{contentById[stop.contentId]?.name}</StopName>
  <StopReason>{stop.reason}</StopReason>
  <ActionRow>
    <ActionButton onPress={() => setStops((prev) => moveStop(prev, stop.contentId, 'up'))}>
      <ActionLabel>▲</ActionLabel>
    </ActionButton>
    <ActionButton onPress={() => setStops((prev) => moveStop(prev, stop.contentId, 'down'))}>
      <ActionLabel>▼</ActionLabel>
    </ActionButton>
    <ActionButton onPress={() => setStops((prev) => removeStop(prev, stop.contentId))}>
      <ActionLabel>삭제</ActionLabel>
    </ActionButton>
  </ActionRow>
</StopCard>
```

(`ActionRow`/`ActionButton`/`ActionLabel`은 기존 컨벤션대로 styled-components로 새로 정의 — `flex-direction: row`, `gap: 8px`, 텍스트 버튼 스타일)

- [ ] **Step 3: 날짜 섹션 끝에 "+ 장소 추가" 토글 리스트 추가**

```tsx
interface ItineraryResultScreenProps {
  selectedRegions: string[];
  selectedIds: string[];
  priorities: Record<string, Priority>;
}

// day별 렌더링 블록 안, 스탑 목록 다음에:
const usedIds = stops.map((s) => s.contentId);
const candidates = CONTENTS.filter(
  (c) => selectedRegions.includes(c.regionId) && !usedIds.includes(c.id),
);

// day별로 candidates.map하여 AddButton 리스트 렌더링, 탭 시:
onPress={() => setStops((prev) => addStop(prev, candidate.id, day))}
```

- 처음엔 "+ 장소 추가" 버튼만 보이고 탭하면 후보 리스트가 펼쳐지는 토글 방식(`expandedDay: number | null` state)으로 구현한다.

- [ ] **Step 4: 타입 검사** — `bunx tsc --noEmit`

---

## Task 3: App.tsx — selectedRegions 전달

- [ ] **Step 1: `ItineraryResultScreen`에 `selectedRegions={selectedRegions}` prop 추가**
- [ ] **Step 2: 타입 검사 + 테스트** — `bunx tsc --noEmit && bun run test:run`

---

## 검증 체크리스트

- [ ] `bun run start -- --offline --clear`로 앱 실행, 일정 화면까지 도달
- [ ] 같은 날 안에서 ▲/▼로 순서를 바꾸면 시간이 자동으로 다시 배정됨
- [ ] 날의 첫 스탑에서 ▲, 마지막 스탑에서 ▼를 눌러도 에러 없이 무시됨 (경계 조건)
- [ ] 삭제 시 해당 스탑이 사라지고 남은 스탑 시간이 다시 채워짐
- [ ] "+ 장소 추가"로 같은 지역의 미선택 콘텐츠를 골라 추가하면 목록 끝에 붙음
- [ ] `bunx tsc --noEmit` 에러 없음
- [ ] `bun run test:run` 신규 테스트 포함 전체 통과

## 이번 범위에서 제외한 것 (별도 이슈)

- 특정 장소 고정
- 전체 일정 다시 생성 / 하루 단위 다시 생성
- 수정된 일정의 저장(서버 저장), 공유
