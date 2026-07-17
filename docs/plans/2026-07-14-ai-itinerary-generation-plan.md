# AI 일정 생성 기능 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Context:** MVP 핵심 기능(mvp-scope.md, key-features.md)의 마지막 조립 단계로, 사용자가 담은 콘텐츠와 우선순위(이슈 #19, `PrioritySelectScreen`)를 받아 AI가 여행 일정을 만들어주는 화면이다. 조사 결과 이 리포지토리에는 백엔드/AI 연동 레이어가 전혀 없어(services/api 디렉토리, fetch/axios, 관련 SDK 전무), 실제 AI 호출은 불가능하다. 또한 `App.tsx`에서 `companions`와 `tripDate`가 화면 체인 끝까지 전달되지 않는 배선 버그가 있으나, **이번 계획에서는 다루지 않고 별도 이슈로 분리한다** (사용자 확인 완료). 따라서 이번 계획은 `selectedRegions`, `selectedIds`, `priorities` 세 가지 입력만으로 동작하는 **목(mock) 일정 생성**을 구현하고, MVP 조건의 "1박 2일 기준" 기본값을 그대로 사용한다.

**Goal:** `PrioritySelectScreen`의 `onContinue` 다음 단계로 `ItineraryResultScreen`을 만든다. 진입 시 잠깐의 "생성 중" 로딩을 보여준 뒤, `selectedIds`+`priorities`를 기반으로 목 서비스 함수가 만든 1박 2일 일정(장소·시간·배치 이유 포함)을 일자별로 표시한다.

**Architecture:**
- `services/generateItinerary.ts`: 순수 함수 `generateItinerary({ selectedIds, priorities }): Itinerary`. 나중에 이 함수 내부만 실제 백엔드 호출로 교체하면 되도록, 화면 쪽에서는 이 함수의 시그니처만 알면 되게 분리한다.
- 정렬/배치 로직: `must` 우선순위 콘텐츠를 먼저 채우고, 남는 자리를 `good` → `optional` 순으로 채운 뒤 1일차/2일차에 절반씩 배분한다. 각 스탑은 10:00부터 2시간 간격으로 시간을 부여한다 (문자열 형식의 `duration` 필드는 파싱하지 않고 고정 간격 사용 — 목 데이터 수준에서 과도한 정교함은 불필요).
- 배치 이유(reason)는 우선순위 라벨 기반의 간단한 템플릿 문자열로 생성한다 (예: "꼭 가기로 표시하셔서 1일차 오전에 배치했습니다").
- `ItineraryResultScreen`은 `useState`로 `status: 'loading' | 'done'`만 관리하고, `useEffect` + `setTimeout`(약 1.2초)으로 "AI가 일정을 만들고 있어요" 로딩 상태를 흉내낸 뒤 목 데이터를 계산해 보여준다. **실패/에러 상태는 이번 범위에 넣지 않는다** — mock은 항상 성공하므로 실패 UI를 지금 만들면 죽은 코드가 된다. 실제 백엔드 연동 시(별도 이슈) `.agents/docs/error-handling-flow.md`의 "AI 일정 생성 실패" 스펙(타임아웃 로딩 → 재시도 유도, "일정 생성에 실패했습니다. 컨텐츠를 추가하거나 다시 시도해주세요.")을 그때 적용한다.
- App.tsx: `Screen` 유니온에 `'itinerary'` 추가, `PrioritySelectScreen`의 `onContinue`가 `priorities`를 상태로 끌어올리고 `setScreen('itinerary')` 하도록 변경.

**Tech Stack:** React Native 0.81.5, Expo ~54, styled-components ^6.4.1, TypeScript ~5.9.2

## Global Constraints

- 패키지 매니저: Bun (npm/yarn 사용 금지)
- 스타일: styled-components + COLORS 상수 사용, inline style 지양
- transient props: `$` 접두사 필수
- 모든 컴포넌트/함수는 named export
- **companions/tripDate 배선 버그는 이 계획에서 고치지 않는다** (별도 이슈)
- **이 계획은 `feat/19`가 아닌 새 브랜치(이슈 생성 후 `feat/<이슈번호>`)에서 실행한다**

---

## 생성/수정 파일

| 파일 | 작업 |
|------|------|
| `types/itinerary.ts` | 신규 — `ItineraryStop`, `Itinerary` 타입 |
| `services/generateItinerary.ts` | 신규 — 목 일정 생성 순수 함수 |
| `screens/ItineraryResultScreen.tsx` | 신규 — 로딩 → 일정 결과 표시 화면 |
| `App.tsx` | 수정 — `Screen`에 `'itinerary'` 추가, 화면 전환 연결 |

---

## Task 1: 타입 정의 (`types/itinerary.ts`)

```ts
export interface ItineraryStop {
  contentId: string;
  day: number; // 1 | 2
  startTime: string; // "10:00"
  endTime: string; // "12:00"
  reason: string;
}

export interface Itinerary {
  totalDays: number; // 2 (1박 2일 고정)
  stops: ItineraryStop[];
}
```

- [ ] **Step 1: 파일 생성**
- [ ] **Step 2: 타입 검사** — `bunx tsc --noEmit`

---

## Task 2: 목 일정 생성 서비스 (`services/generateItinerary.ts`)

**Files:** Create `services/generateItinerary.ts`

**Interfaces:** Produces `generateItinerary({ selectedIds, priorities }): Itinerary`

- [ ] **Step 1: 함수 구현**

```ts
import { PRIORITY_LABELS, type Priority } from '../types/priority';
import type { Itinerary, ItineraryStop } from '../types/itinerary';

interface GenerateItineraryInput {
  selectedIds: string[];
  priorities: Record<string, Priority>;
}

const PRIORITY_WEIGHT: Record<Priority, number> = { must: 0, good: 1, optional: 2 };

export function generateItinerary({ selectedIds, priorities }: GenerateItineraryInput): Itinerary {
  const ordered = [...selectedIds].sort(
    (a, b) => PRIORITY_WEIGHT[priorities[a]] - PRIORITY_WEIGHT[priorities[b]],
  );

  const midpoint = Math.ceil(ordered.length / 2);
  const stops: ItineraryStop[] = ordered.map((contentId, index) => {
    const day = index < midpoint ? 1 : 2;
    const slotIndex = index < midpoint ? index : index - midpoint;
    const startHour = 10 + slotIndex * 2;

    return {
      contentId,
      day,
      startTime: `${String(startHour).padStart(2, '0')}:00`,
      endTime: `${String(startHour + 2).padStart(2, '0')}:00`,
      reason: `${PRIORITY_LABELS[priorities[contentId]]}로 표시하셔서 ${day}일차에 배치했습니다.`,
    };
  });

  return { totalDays: 2, stops };
}
```

- [ ] **Step 2: 타입 검사** — `bunx tsc --noEmit`
- [ ] **Step 3: 유닛 테스트 작성** (`services/generateItinerary.test.ts`, `utils/calculateNights.test.ts` 패턴 참고 — `describe`/`it` 한국어 설명, `expect().toBe()`)
  - "must 우선순위 콘텐츠가 1일차 앞쪽에 배치된다"
  - "선택한 콘텐츠 수만큼 stops가 생성된다"
  - `bun run test:run`으로 통과 확인

---

## Task 3: ItineraryResultScreen (`screens/ItineraryResultScreen.tsx`)

**Files:** Create `screens/ItineraryResultScreen.tsx`
**Interfaces:** Produces `ItineraryResultScreen({ selectedIds, priorities })`

- [ ] **Step 1: 화면 구현**

```tsx
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, Text, View } from 'react-native';
import styled from 'styled-components';
import { COLORS } from '../constants/colors';
import { CONTENTS } from '../constants/contents';
import { generateItinerary } from '../services/generateItinerary';
import type { Priority } from '../types/priority';

interface ItineraryResultScreenProps {
  selectedIds: string[];
  priorities: Record<string, Priority>;
}

// ScreenContainer/Header/Title/Subtitle는 기존 화면들과 동일한 스타일 컨벤션으로 정의

const DayLabel = styled(Text)`
  font-size: 17px;
  font-weight: 600;
  color: ${COLORS.gray900};
  margin: 16px 20px 8px;
`;

const StopCard = styled(View)`
  background-color: ${COLORS.white};
  border-radius: 12px;
  border-width: 1px;
  border-color: ${COLORS.gray200};
  margin-horizontal: 20px;
  margin-bottom: 10px;
  padding: 14px 16px;
`;

const StopTime = styled(Text)`
  font-size: 13px;
  color: ${COLORS.amber500};
  font-weight: 600;
`;

const StopName = styled(Text)`
  font-size: 16px;
  font-weight: 500;
  color: ${COLORS.gray900};
  margin-top: 4px;
`;

const StopReason = styled(Text)`
  font-size: 13px;
  color: ${COLORS.gray500};
  margin-top: 6px;
`;

const LoadingContainer = styled(View)`
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 16px;
`;

const LoadingText = styled(Text)`
  font-size: 15px;
  color: ${COLORS.gray500};
`;

export function ItineraryResultScreen({ selectedIds, priorities }: ItineraryResultScreenProps) {
  const [status, setStatus] = useState<'loading' | 'done'>('loading');

  useEffect(() => {
    const timer = setTimeout(() => setStatus('done'), 1200);
    return () => clearTimeout(timer);
  }, []);

  const itinerary = useMemo(
    () => generateItinerary({ selectedIds, priorities }),
    [selectedIds, priorities],
  );

  const contentById = useMemo(
    () => Object.fromEntries(CONTENTS.map((c) => [c.id, c])),
    [],
  );

  if (status === 'loading') {
    return (
      <ScreenContainer>
        <LoadingContainer>
          <ActivityIndicator size="large" color={COLORS.amber500} />
          <LoadingText>AI가 일정을 만들고 있어요...</LoadingText>
        </LoadingContainer>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Header>
        <Title>일정이 완성됐어요</Title>
        <Subtitle>1박 2일 기준으로 만들었어요</Subtitle>
      </Header>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {[1, 2].map((day) => (
          <View key={day}>
            <DayLabel>{day}일차</DayLabel>
            {itinerary.stops
              .filter((stop) => stop.day === day)
              .map((stop) => (
                <StopCard key={stop.contentId}>
                  <StopTime>{stop.startTime} - {stop.endTime}</StopTime>
                  <StopName>{contentById[stop.contentId]?.name}</StopName>
                  <StopReason>{stop.reason}</StopReason>
                </StopCard>
              ))}
          </View>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}
```

- [ ] **Step 2: 타입 검사** — `bunx tsc --noEmit`

---

## Task 4: App.tsx 연결

- [ ] **Step 1: `Screen`에 `'itinerary'` 추가, `priorities` 상태 끌어올림**
- [ ] **Step 2: `PrioritySelectScreen`의 `onContinue`에서 `setPriorities` + `setScreen('itinerary')`**
- [ ] **Step 3: `screen === 'itinerary'` 분기에서 `ItineraryResultScreen` 렌더링 (`selectedIds`, `priorities` 전달)**
- [ ] **Step 4: 타입 검사 + 테스트** — `bunx tsc --noEmit && bun run test:run`

---

## 검증 체크리스트

- [ ] `bun run start -- --offline --clear`로 앱 실행
- [ ] 우선순위 화면에서 "일정 만들기" 누르면 약 1.2초 로딩 후 일정 화면 전환
- [ ] "꼭 가기"로 설정한 콘텐츠가 1일차 앞쪽 시간대에 배치되는지 확인
- [ ] 1일차/2일차 각각 장소, 시간, 배치 이유 텍스트가 표시되는지 확인
- [ ] `bunx tsc --noEmit` 에러 없음
- [ ] `bun run test:run` 신규 테스트 포함 전체 통과

## 이번 범위에서 제외한 것 (별도 이슈)

- `companions`/`tripDate`가 화면 체인 끝까지 전달되지 않는 배선 버그 수정
- 실제 백엔드/AI 연동 (services/generateItinerary.ts 내부 교체)
- 일정 생성 실패 시 에러 UI (`.agents/docs/error-handling-flow.md` 스펙 — 실제 연동 시 적용)
- 일정 수정(순서 변경/삭제/대체 장소), 저장, 공유 기능
