# CompanionSelectScreen 구현 계획

## Context

사용자 흐름 3단계(지역 선택 → 날짜/기간 설정 → **동행 조건 선택**)에 해당하는 화면 구현.
MVP 필수 기능으로, AI 일정 생성 시 핵심 입력값이 되는 동행 유형을 사용자가 직접 선택한다.

> ⚠️ 브랜치 주의: `feat/14`는 TripDateScreen 전용. 이 기능은 **새 이슈 생성 후 새 브랜치**에서 구현할 것.

---

## 생성/수정 파일

| 파일 | 작업 |
|------|------|
| `types/companion.ts` | 신규 생성 |
| `constants/companions.ts` | 신규 생성 |
| `components/molecules/CompanionCard.tsx` | 신규 생성 |
| `screens/CompanionSelectScreen.tsx` | 신규 생성 |
| `screens/TripDateScreen.tsx` | `onContinue` prop 추가 |
| `App.tsx` | `'companion'` 화면 분기 추가 |

---

## 타입 정의 (`types/companion.ts`)

```ts
export type CompanionType =
  | 'with_kids' | 'with_parents' | 'whole_family' | 'less_walking'
  | 'nature_focused' | 'experience_focused' | 'food_focused' | 'indoor_alternative';

export interface Companion {
  id: CompanionType;
  label: string;
  emoji: string;
  description: string;
}
```

---

## 데이터 (`constants/companions.ts`)

`COMPANIONS: Companion[]` 배열 8개 항목:

| id | label | emoji | description |
|----|-------|-------|-------------|
| `with_kids` | 아이와 함께 | 👶 | 아이가 즐길 수 있는 코스 |
| `with_parents` | 부모님과 함께 | 👴 | 어르신도 편안한 여행 |
| `whole_family` | 가족 전체 | 👨‍👩‍👧‍👦 | 온 가족이 함께하는 코스 |
| `less_walking` | 걷기 적게 | 🚗 | 이동이 편한 코스 위주 |
| `nature_focused` | 자연 위주 | 🌿 | 자연 경관을 즐기는 여행 |
| `experience_focused` | 체험 위주 | 🎨 | 직접 체험하며 즐기는 코스 |
| `food_focused` | 음식 위주 | 🍽️ | 맛집 탐방이 주인 여행 |
| `indoor_alternative` | 실내 대안 필요 | 🏠 | 날씨 걱정 없는 실내 코스 포함 |

---

## CompanionCard 명세 (`components/molecules/CompanionCard.tsx`)

`RegionCard`와 동일한 `$selected` transient prop 패턴 사용.

```ts
interface CompanionCardProps {
  companion: Companion;
  selected: boolean;
  onPress: () => void;
}
```

**스타일**:
- `Card` (TouchableOpacity): `flex: 1`, `border-radius: 12px`, `padding: 16px`, `min-height: 110px`, `border-width: 2px`
  - 미선택: `border-color: gray200`, `bg: white`
  - 선택: `border-color: amber500`, `bg: amber50`
- `EmojiText`: `font-size: 28px`, `margin-bottom: 8px`
- `CardLabel`: `font-size: 14px`, `font-weight: 600`
  - 미선택: `color: gray900` / 선택: `color: amber700`
- `CardDescription`: `font-size: 12px`, `color: gray500`

---

## CompanionSelectScreen 명세 (`screens/CompanionSelectScreen.tsx`)

```ts
interface CompanionSelectScreenProps {
  onContinue: (companions: CompanionType[]) => void;
}
```

**레이아웃**:
```
SafeAreaView (bg: gray50)
  ScrollView (paddingBottom: 120)
    Header
      Title: "누구와 함께 가시나요?"
      Subtitle: "동행 조건을 선택하세요"
    GridContent (padding-horizontal: 20, gap: 12, margin-top: 8)
      Row (flex-direction: row, gap: 12) × 4행
        CompanionCard × 2열
  [selectedIds.length > 0일 때]
  BottomBar (하단 고정)
    CTAButton: "여행 준비 완료!"
```

**2열 그리드 구현**: `COMPANIONS`를 2개씩 묶어 `pair` 배열(4행)로 변환 후 `Row`로 렌더링. 홀수 마지막 항목 생길 경우 `<View style={{ flex: 1 }} />` spacer 추가.

**토글 로직**: `RegionSelectScreen`과 동일 패턴
```ts
const [selectedIds, setSelectedIds] = useState<CompanionType[]>([]);
const handleToggle = (id: CompanionType) =>
  setSelectedIds((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
```

---

## TripDateScreen 수정 (`screens/TripDateScreen.tsx`)

1. `onContinue: (tripDate: TripDate) => void` prop 추가
2. CTA `onPress`의 `console.log` → `onContinue({ startDate, durationType, nights })` 교체

---

## App.tsx 수정

```ts
import { CompanionSelectScreen } from './screens/CompanionSelectScreen';
import type { TripDate } from './types/trip';
import type { CompanionType } from './types/companion';

type Screen = 'region' | 'date' | 'companion';

// 상태 추가
const [tripDate, setTripDate] = useState<TripDate | null>(null);

// date 화면: onContinue 연결
<TripDateScreen onContinue={(date) => { setTripDate(date); setScreen('companion'); }} />

// companion 화면 추가
if (screen === 'companion') {
  return (
    <CompanionSelectScreen
      onContinue={(companions) => {
        console.log({ selectedRegions, tripDate, companions });
        // 추후 콘텐츠 탐색 화면으로 연결
      }}
    />
  );
}
```

---

## 구현 순서

1. `types/companion.ts`
2. `constants/companions.ts`
3. `components/molecules/CompanionCard.tsx`
4. `screens/TripDateScreen.tsx` — onContinue prop 추가
5. `screens/CompanionSelectScreen.tsx`
6. `App.tsx`

---

## 검증

- [ ] `bun run start`로 앱 실행
- [ ] TripDateScreen CTA 탭 → CompanionSelectScreen 이동
- [ ] 카드 탭 시 amber 선택 스타일 전환
- [ ] 재탭 시 미선택으로 복귀
- [ ] 1개 이상 선택 시 "여행 준비 완료!" CTA 노출
- [ ] 모두 해제 시 CTA 숨김
- [ ] CTA 탭 시 console.log에 `{ selectedRegions, tripDate, companions }` 출력
- [ ] `bun run test:run` — 기존 테스트 4개 통과
