# 우선순위 설정 기능 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Context:** Notion "App MVP 구현 내용" 문서와 로컬 `.agents/docs/mvp-scope.md`에 명시된 MVP 필수 기능 중 하나로, 사용자가 여행 바구니에 담은 콘텐츠 각각에 "꼭 가기 / 가면 좋음 / 시간 남으면" 우선순위를 설정하는 기능이다. 이슈 #17(콘텐츠 담기)에서 담긴 `selectedIds`를 받아 AI 일정 생성의 입력값(우선순위 맵)으로 만드는 다음 단계다. `docs/plans/2026-06-27-content-basket-screen-design.md`에서 "우선순위 설정은 별도 이슈로 분리"라고 명시했던 바로 그 기능이며, **별도의 새 브랜치/이슈**에서 진행해야 한다 (현재 `feat/17`은 이슈 #17 전용 범위).

**Goal:** ContentExploreScreen에서 넘어온 `selectedIds`를 받아, 콘텐츠별로 3단계 우선순위 칩을 선택할 수 있는 `PrioritySelectScreen`을 구현하고, `onContinue(priorities)`로 다음 단계(AI 일정 생성, 아직 미구현)에 연결한다.

**Architecture:**
- 네비게이션은 기존과 동일하게 `App.tsx`의 `useState<Screen>` 조건부 렌더링 체인을 따른다. `selectedIds`를 App 상태로 끌어올리고 `Screen` 유니온에 `'priority'`를 추가한다.
- `PrioritySelectScreen` 내부에서 `priorities: Record<string, Priority>` 로컬 상태를 관리하고, 진입 시 모든 선택된 콘텐츠를 기본값 `'good'`(가면 좋음)으로 초기화한다 (CTA가 항상 활성화되도록 — 이미 이전 화면에서 2개 이상 선택이 보장됨).
- 각 콘텐츠 행은 이름/카테고리/색상 썸네일 등 요약 정보 + `PriorityChips`(3개 pill 칩, 단일 선택 라디오 형태)로 구성한다. `TripDateScreen`의 `DurationSelector`가 3단계 단일 선택 칩의 직접적인 템플릿이다.
- 색상은 기존 팔레트(amber500/amber300/gray200)의 톤 차이로 3단계를 구분한다 (새 색상 토큰 추가 없음).

**Tech Stack:** React Native 0.81.5, Expo ~54, styled-components ^6.4.1, TypeScript ~5.9.2

## Global Constraints

- 패키지 매니저: Bun (npm/yarn 사용 금지)
- 스타일: styled-components + COLORS 상수 사용, inline style 지양
- transient props: `$` 접두사 필수 (`$active`, `$selected` 등)
- 모든 컴포넌트는 named export (`export function`)
- **이 계획은 `feat/17`이 아닌 새 브랜치(예: 이슈 생성 후 `feat/<이슈번호>`)에서 실행한다.**

---

## 생성/수정 파일

| 파일 | 작업 |
|------|------|
| `types/priority.ts` | 신규 — `Priority` 타입 및 `PRIORITY_LABELS` 상수 |
| `components/molecules/PriorityChips.tsx` | 신규 — 3단계 단일 선택 칩 (DurationSelector 패턴 참고) |
| `screens/PrioritySelectScreen.tsx` | 신규 — 콘텐츠별 우선순위 설정 화면 |
| `App.tsx` | 수정 — `Screen`에 `'priority'` 추가, `selectedIds` 상태 끌어올림, 화면 전환 연결 |

---

## Task 1: Priority 타입 정의 (`types/priority.ts`)

**Files:**
- Create: `types/priority.ts`

```ts
export type Priority = 'must' | 'good' | 'optional';

export const PRIORITY_LABELS: Record<Priority, string> = {
  must: '꼭 가기',
  good: '가면 좋음',
  optional: '시간 남으면',
};

export const PRIORITY_ORDER: Priority[] = ['must', 'good', 'optional'];
```

- [ ] **Step 1: 파일 생성 및 위 내용 작성**
- [ ] **Step 2: 타입 검사**
```
bunx tsc --noEmit
```

---

## Task 2: PriorityChips 컴포넌트 (`components/molecules/PriorityChips.tsx`)

**Files:**
- Create: `components/molecules/PriorityChips.tsx`

**Interfaces:**
- Produces: `PriorityChips({ value, onChange })` — PrioritySelectScreen에서 콘텐츠별로 렌더링

**참고:** `components/molecules/DurationSelector.tsx`의 단일 선택 pill 칩 패턴(`$active` prop, `border-radius: 20px`)을 그대로 따른다.

- [ ] **Step 1: 컴포넌트 구현**

```tsx
import { Text, TouchableOpacity, View } from 'react-native';
import styled from 'styled-components';
import { COLORS } from '../../constants/colors';
import { PRIORITY_LABELS, PRIORITY_ORDER, type Priority } from '../../types/priority';

interface PriorityChipsProps {
  value: Priority;
  onChange: (priority: Priority) => void;
}

const Row = styled(View)`
  flex-direction: row;
  gap: 8px;
`;

const Chip = styled(TouchableOpacity)<{ $active: boolean; $priority: Priority }>`
  padding-vertical: 8px;
  padding-horizontal: 14px;
  border-radius: 20px;
  background-color: ${({ $active, $priority }) => {
    if (!$active) return COLORS.gray100;
    if ($priority === 'must') return COLORS.amber500;
    if ($priority === 'good') return COLORS.amber300;
    return COLORS.gray200;
  }};
`;

const ChipLabel = styled(Text)<{ $active: boolean }>`
  font-size: 13px;
  font-weight: 500;
  color: ${({ $active }) => ($active ? COLORS.white : COLORS.gray500)};
`;

export function PriorityChips({ value, onChange }: PriorityChipsProps) {
  return (
    <Row>
      {PRIORITY_ORDER.map((priority) => (
        <Chip
          key={priority}
          $active={value === priority}
          $priority={priority}
          onPress={() => onChange(priority)}
          activeOpacity={0.8}
        >
          <ChipLabel $active={value === priority}>{PRIORITY_LABELS[priority]}</ChipLabel>
        </Chip>
      ))}
    </Row>
  );
}
```

> 참고: `optional`(시간 남으면) 활성 시 배경이 `COLORS.gray200`이라 `ChipLabel`의 흰 글자와 대비가 약할 수 있음 — 실제 렌더링 후 대비 확인, 필요 시 `gray700`로 조정.

- [ ] **Step 2: 타입 검사**
```
bunx tsc --noEmit
```

---

## Task 3: PrioritySelectScreen (`screens/PrioritySelectScreen.tsx`)

**Files:**
- Create: `screens/PrioritySelectScreen.tsx`

**Interfaces:**
- Consumes: `PriorityChips({ value, onChange })`
- Produces: `PrioritySelectScreen({ selectedIds, onContinue })`

- [ ] **Step 1: 화면 골격 작성**

```tsx
import { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import styled from 'styled-components';
import { PriorityChips } from '../components/molecules/PriorityChips';
import { COLORS } from '../constants/colors';
import { CATEGORIES } from '../constants/categories'; // 기존 ContentCard에서 쓰던 카테고리 상수 재사용
import { CONTENTS } from '../constants/contents';
import type { Priority } from '../types/priority';

interface PrioritySelectScreenProps {
  selectedIds: string[];
  onContinue: (priorities: Record<string, Priority>) => void;
}

// ScreenContainer/Header/Title/Subtitle/BottomBar/CTAButton/CTALabel은
// ContentExploreScreen.tsx와 동일한 스타일 컨벤션으로 정의 (padding, 색상 값 그대로 재사용)

const Row = styled(View)`
  flex-direction: row;
  background-color: ${COLORS.white};
  border-radius: 12px;
  border-width: 1px;
  border-color: ${COLORS.gray200};
  margin-horizontal: 20px;
  padding: 14px 16px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const ContentName = styled(Text)`
  font-size: 15px;
  font-weight: 500;
  color: ${COLORS.gray900};
  flex-shrink: 1;
`;

export function PrioritySelectScreen({ selectedIds, onContinue }: PrioritySelectScreenProps) {
  const selectedContents = useMemo(
    () => CONTENTS.filter((c) => selectedIds.includes(c.id)),
    [selectedIds],
  );

  const [priorities, setPriorities] = useState<Record<string, Priority>>(() =>
    Object.fromEntries(selectedIds.map((id) => [id, 'good' as Priority])),
  );

  const handleChange = (id: string, priority: Priority) => {
    setPriorities((prev) => ({ ...prev, [id]: priority }));
  };

  return (
    <ScreenContainer>
      <Header>
        <Title>우선순위를 정해주세요</Title>
        <Subtitle>담은 콘텐츠별로 얼마나 가고 싶은지 알려주세요</Subtitle>
      </Header>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120, gap: 12 }}>
        {selectedContents.map((content) => (
          <Row key={content.id}>
            <ContentName numberOfLines={1}>{content.name}</ContentName>
            <PriorityChips
              value={priorities[content.id]}
              onChange={(p) => handleChange(content.id, p)}
            />
          </Row>
        ))}
      </ScrollView>
      <BottomBar>
        <CTAButton onPress={() => onContinue(priorities)} activeOpacity={0.8}>
          <CTALabel>일정 만들기</CTALabel>
        </CTAButton>
      </BottomBar>
    </ScreenContainer>
  );
}
```

> 구현 시 `ScreenContainer`/`Header`/`Title`/`Subtitle`/`BottomBar`/`CTAButton`/`CTALabel` styled-components 정의를 `ContentExploreScreen.tsx`에서 그대로 가져와 선언(중복이지만 현재 프로젝트에 공통 레이아웃 컴포넌트 추출 선례가 없으므로 기존 컨벤션을 따름). `constants/categories.ts` 실제 파일명은 구현 시 확인 필요(조사에서 `CATEGORIES`가 `ContentCard.tsx`에서 import되는 경로 재확인).

- [ ] **Step 2: 타입 검사**
```
bunx tsc --noEmit
```

---

## Task 4: App.tsx 연결

**Files:**
- Modify: `App.tsx`

- [ ] **Step 1: Screen 유니온에 `'priority'` 추가, `selectedIds` 상태 끌어올림**

```tsx
type Screen = 'region' | 'date' | 'companion' | 'explore' | 'priority';

const [selectedIds, setSelectedIds] = useState<string[]>([]);
```

- [ ] **Step 2: ContentExploreScreen의 onContinue에서 화면 전환**

```tsx
<ContentExploreScreen
  selectedRegions={selectedRegions}
  onContinue={(ids) => {
    setSelectedIds(ids);
    setScreen('priority');
  }}
/>
```

- [ ] **Step 3: PrioritySelectScreen 렌더링 분기 추가**

```tsx
if (screen === 'priority') {
  return (
    <PrioritySelectScreen
      selectedIds={selectedIds}
      onContinue={(priorities) => {
        console.log({ selectedRegions, selectedIds, priorities });
        // 추후 AI 일정 생성 화면으로 연결 (별도 이슈)
      }}
    />
  );
}
```

- [ ] **Step 4: 타입 검사 + 테스트**
```
bunx tsc --noEmit
bun run test:run
```

---

## 검증 체크리스트

- [ ] `bun run start -- --clear`로 앱 실행
- [ ] 콘텐츠 담기 화면에서 2개 이상 담고 "일정 만들기" 탭 시 우선순위 화면으로 전환 확인
- [ ] 담은 콘텐츠 전부가 기본값 "가면 좋음"으로 표시되는지 확인
- [ ] 칩 탭 시 단일 선택(라디오)으로 전환되고 색상이 3단계로 구분되는지 확인 (특히 "시간 남으면" 활성 시 텍스트 대비 확인)
- [ ] "일정 만들기" 탭 시 console.log에 `{selectedRegions, selectedIds, priorities}` 출력 확인
- [ ] `bunx tsc --noEmit` 에러 없음
- [ ] `bun run test:run` 기존 테스트 통과

## 결정 사항 (사용자 확인 완료)

- 기본 우선순위는 전부 `'good'`(가면 좋음)으로 자동 초기화한다.
- AI 일정 생성 화면은 아직 없으므로 이슈 #17과 동일하게 `console.log` placeholder로 마무리한다.

## 남은 결정 사항 (구현 착수 전 확인 필요)

- **브랜치/이슈**: 이 기능을 위한 새 GitHub 이슈를 먼저 만들지, 이슈 번호 없이 임시 브랜치명으로 시작할지는 아직 미정 — 실제 구현 착수 시 별도로 결정한다.
