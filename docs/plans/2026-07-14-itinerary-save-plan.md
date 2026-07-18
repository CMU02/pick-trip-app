# 일정 저장 기능 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Context:** MVP 핵심 기능(mvp-scope.md) "일정 저장 (서버 저장) - 로그인 후 저장한 일정이 앱 재시작 후에도 조회 가능"을 구현한다. 조사 결과 이 리포지토리에는 로그인/인증이 전혀 구현되어 있지 않고(화면·상태·타입 모두 없음), 로컬/서버 영속성 레이어(AsyncStorage 등)도 전혀 없다. 따라서 이번 계획은 **로그인 게이트 없이 AsyncStorage로 로컬에 저장**하는 것으로 범위를 좁힌다 (사용자 확인 완료). 실제 서버 저장/로그인은 별도 이슈로 분리한다.

**Goal:** `ItineraryResultScreen`(feat/21에서 편집 기능까지 완성됨)에 "일정 저장" 버튼을 추가해 현재 일정을 AsyncStorage에 저장하고, 앱을 재시작하면 저장된 일정이 있을 때 "이어보기" 안내 화면을 먼저 보여준다.

**Architecture:**
- 새 의존성 `@react-native-async-storage/async-storage`를 `npx expo install`로 추가한다 (Expo 호환 버전 자동 선택).
- `services/itineraryStorage.ts`: `saveItinerary(data)`/`loadItinerary()` 두 개의 async 함수로 AsyncStorage 읽기/쓰기를 감싼다. 나중에 실제 서버 API로 교체할 때 이 파일 내부만 바꾸면 되도록 화면에서는 이 함수 시그니처만 사용한다.
- `types/savedItinerary.ts`: `SavedItinerary` 타입(`selectedRegions`, `selectedIds`, `priorities`, `stops`, `savedAt`)을 정의한다 — 재개(resume) 시 `ItineraryResultScreen`을 그대로 재구성하는 데 필요한 값을 전부 담는다.
- `App.tsx`는 부팅 시 `loadItinerary()`로 저장된 일정 유무를 확인한다. 있으면 새 화면 `ResumeItineraryScreen`(이어보기/새로 만들기 선택)을 먼저 보여주고, "이어보기"를 누르면 저장된 값으로 상태를 채운 뒤 바로 `itinerary` 화면으로 이동한다. `ItineraryResultScreen`은 `initialStops`(선택적 prop)를 받으면 목 생성(`generateItinerary`)을 건너뛰고 그 값을 그대로 초기 state로 쓴다.
- 저장 실패는 `.agents/docs/error-handling-flow.md`의 "일정 저장 실패" 스펙 중 실제로 적용 가능한 부분("저장에 실패했습니다. 다시 시도해주세요.")만 반영한다. "인증 만료 시 재로그인 유도"는 로그인 자체가 없어 이번 범위에서 제외한다.

**Tech Stack:** React Native 0.81.5, Expo ~54, styled-components ^6.4.1, TypeScript ~5.9.2, `@react-native-async-storage/async-storage`(신규)

## Global Constraints

- 패키지 매니저: Bun (스크립트 실행), 네이티브 패키지 추가는 `npx expo install`로 버전 호환성 확보
- 스타일: styled-components + COLORS 상수, transient prop `$` 접두사
- 모든 컴포넌트/함수는 named export
- **이 계획은 `feat/21`이 아닌 새 브랜치(이슈 생성 후 `feat/<이슈번호>`)에서, `feat/21`의 현재 워크트리 상태를 이어받아 실행한다**
- 로그인/인증, 실제 서버 저장, "인증 만료 시 재로그인"은 범위 밖 (별도 이슈)

---

## 생성/수정 파일

| 파일 | 작업 |
|------|------|
| `types/savedItinerary.ts` | 신규 — `SavedItinerary` 타입 |
| `services/itineraryStorage.ts` | 신규 — AsyncStorage 기반 `saveItinerary`/`loadItinerary` |
| `screens/ResumeItineraryScreen.tsx` | 신규 — 앱 시작 시 저장된 일정 안내(이어보기/새로 만들기) |
| `screens/ItineraryResultScreen.tsx` | 수정 — `initialStops` 옵션 prop, "일정 저장" 버튼 |
| `App.tsx` | 수정 — 부팅 시 저장 여부 확인, 화면 흐름에 `resume` 단계 추가 |

---

## Task 0: 의존성 추가

- [ ] **Step 1: `npx expo install @react-native-async-storage/async-storage` 실행**
- [ ] **Step 2: `bunx tsc --noEmit`로 기존 코드 영향 없는지 확인**

---

## Task 1: 타입/서비스 (`types/savedItinerary.ts`, `services/itineraryStorage.ts`)

```ts
// types/savedItinerary.ts
import type { ItineraryStop } from './itinerary';
import type { Priority } from './priority';

export interface SavedItinerary {
  selectedRegions: string[];
  selectedIds: string[];
  priorities: Record<string, Priority>;
  stops: ItineraryStop[];
  savedAt: string;
}
```

```ts
// services/itineraryStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SavedItinerary } from '../types/savedItinerary';

const STORAGE_KEY = 'pick-trip:saved-itinerary';

export async function saveItinerary(data: SavedItinerary): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export async function loadItinerary(): Promise<SavedItinerary | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as SavedItinerary) : null;
}
```

- [ ] **Step 1: 두 파일 생성**
- [ ] **Step 2: 타입 검사** — `bunx tsc --noEmit`
- [ ] **Step 3: 유닛 테스트는 생략** (AsyncStorage I/O라 순수 함수 테스트 대상이 아님 — 화면 수동 검증으로 대체)

---

## Task 2: ResumeItineraryScreen (`screens/ResumeItineraryScreen.tsx`)

**Interfaces:** Produces `ResumeItineraryScreen({ savedAt, onResume, onStartNew })`

- [ ] **Step 1: 화면 구현** — 기존 화면과 동일한 `ScreenContainer`/`Header`/`Title`/`Subtitle` 컨벤션 + 버튼 2개("이어보기": amber500 배경, "새로 만들기": 테두리만)
- [ ] **Step 2: 타입 검사** — `bunx tsc --noEmit`

---

## Task 3: ItineraryResultScreen — 저장 + 재개 지원

- [ ] **Step 1: props에 `initialStops?: ItineraryStop[]` 추가, `stops`/`status` 초기값 분기**

```tsx
const [status, setStatus] = useState<'loading' | 'done'>(initialStops ? 'done' : 'loading');
const [stops, setStops] = useState<ItineraryStop[]>(
  () => initialStops ?? generateItinerary({ selectedIds, priorities }).stops,
);
```

- [ ] **Step 2: "일정 저장" 버튼 + 저장 상태 추가**

```tsx
const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle');

const handleSave = async () => {
  try {
    await saveItinerary({ selectedRegions, selectedIds, priorities, stops, savedAt: new Date().toISOString() });
    setSaveState('saved');
  } catch {
    setSaveState('error');
  }
};
```

버튼 라벨: `idle` → "일정 저장", `saved` → "저장 완료", `error` → "저장 실패했습니다. 다시 시도해주세요." (탭하면 다시 `handleSave` 재시도)

- [ ] **Step 3: 타입 검사** — `bunx tsc --noEmit`

---

## Task 4: App.tsx — 부팅 시 저장 여부 확인

- [ ] **Step 1: `Screen`에 `'loading'`, `'resume'` 추가, 초기값 `'loading'`**
- [ ] **Step 2: 부팅 `useEffect`로 `loadItinerary()` 호출 → 있으면 `resume`, 없으면 `region`으로 전환**
- [ ] **Step 3: `resume` 분기에서 `ResumeItineraryScreen` 렌더링, `onResume`에서 저장값으로 상태 채우고 `initialStops` 세팅 후 `itinerary`로 전환, `onStartNew`에서 `region`으로 전환**
- [ ] **Step 4: `itinerary` 렌더링부에 `initialStops` 전달**
- [ ] **Step 5: 타입 검사 + 테스트** — `bunx tsc --noEmit && bun run test:run`

---

## 검증 체크리스트

- [ ] `bun run start -- --offline --clear`로 앱 실행 (최초 실행, 저장된 일정 없음) → 바로 지역 선택 화면
- [ ] 일정 화면에서 "일정 저장" 탭 → "저장 완료"로 라벨 변경
- [ ] 앱 재시작(Expo Go에서 완전 종료 후 재실행) → "저장된 일정이 있어요" 안내 화면 표시
- [ ] "이어보기" 탭 → 저장했던 일정(순서 변경/삭제/추가 반영된 상태 포함)이 그대로 보임
- [ ] "새로 만들기" 탭 → 지역 선택부터 새로 시작
- [ ] `bunx tsc --noEmit` 에러 없음
- [ ] `bun run test:run` 기존 테스트 전체 통과

## 이번 범위에서 제외한 것 (별도 이슈)

- 로그인/인증 (Kakao, Google 소셜 로그인)
- 실제 서버 저장 API 연동 (`services/itineraryStorage.ts` 내부를 그때 교체)
- 인증 만료 시 재로그인 유도
- 저장된 일정 여러 개 관리(목록/삭제) — 지금은 최신 1개만 덮어쓰기 저장
