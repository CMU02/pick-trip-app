# TripDateScreen 구현 계획

## ⚠️ 브랜치 주의사항

현재 브랜치 `feat/5`는 이슈 #5(RegionSelectScreen) 전용이다.  
이 기능은 **새 이슈를 생성하고 새 브랜치(`feat/<새이슈번호>`)에서 구현**해야 한다.  
구현 전에 반드시 `feat/5` PR을 먼저 완료할 것.

---

## Context

Notion "App MVP 구현 내용" 페이지 기반. MVP 구현 조건: **"당일치기부터 커스텀 기간까지 설정 가능"**.  
사용자 흐름 3단계(지역 선택 → **날짜/기간 설정** → 동행 조건)에 해당.  
AI 일정 생성 시 "여행 날짜와 기간"이 핵심 입력값(`key-features.md` 4번 항목).

---

## 생성/수정 파일

| 파일 | 역할 |
|------|------|
| `types/trip.ts` | TripDate 인터페이스 |
| `components/molecules/DurationSelector.tsx` | 기간 프리셋 칩 버튼 그룹 |
| `screens/TripDateScreen.tsx` | 날짜/기간 설정 메인 화면 |
| `App.tsx` (수정) | 화면 전환 state 추가 (`region` → `date`) |
| `screens/RegionSelectScreen.tsx` (수정) | CTA에 `onContinue` prop 추가 |

---

## 추가 패키지 설치 필요

```bash
bunx expo install @react-native-community/datetimepicker
```

네이티브 OS 달력/날짜 선택 UI 제공 (iOS: 캘린더, Android: 머티리얼 다이얼로그)

---

## 타입

```ts
// types/trip.ts
export type DurationType = 'day' | '1night' | '2night' | 'custom';

export interface TripDate {
  startDate: Date;
  durationType: DurationType;
  nights: number;  // 당일치기=0, 1박2일=1, 2박3일=2, 커스텀=N
}
```

---

## 컴포넌트 명세

### DurationSelector (`components/molecules/DurationSelector.tsx`)

```ts
interface DurationSelectorProps {
  selected: DurationType | null;
  customNights: number;
  onSelect: (type: DurationType) => void;
  onCustomNightsChange: (nights: number) => void;
}
```

- 칩 버튼 4개: `당일치기`, `1박 2일`, `2박 3일`, `커스텀`
- 선택된 칩: amber500 배경 + white 텍스트
- 미선택 칩: white 배경 + gray700 텍스트 + gray200 테두리
- `커스텀` 선택 시 `[−] N박 [+]` 카운터 노출 (최소 1박, 최대 30박)
- 재사용: `COLORS` (constants/colors.ts)

### TripDateScreen (`screens/TripDateScreen.tsx`)

**상태:**
```ts
const [startDate, setStartDate] = useState<Date | null>(null);
const [durationType, setDurationType] = useState<DurationType | null>(null);
const [customNights, setCustomNights] = useState(3);
const [showPicker, setShowPicker] = useState(false);
```

**레이아웃:**
```
SafeAreaView (flex:1, background gray50)
  └─ ScrollView (contentPaddingBottom: 120)
       ├─ 헤더 (padding: 24 20 8)
       │    ├─ "언제 떠나볼까요?" (fontSize 24, fontWeight 500)
       │    └─ "여행 날짜와 기간을 선택하세요" (fontSize 15, gray500)
       │
       ├─ 날짜 선택 섹션 (margin: 24 20 0)
       │    ├─ "출발 날짜" 라벨 (fontSize 14, gray500)
       │    └─ DateButton: 날짜 표시 카드 (탭 시 DateTimePicker 오픈)
       │         └─ 미선택: "날짜를 선택하세요" (gray500 placeholder)
       │         └─ 선택됨: "2025년 7월 5일 (토)" (gray900)
       │
       ├─ 기간 선택 섹션 (margin: 24 20 0)
       │    ├─ "여행 기간" 라벨
       │    └─ DurationSelector 컴포넌트
       │
       └─ 날짜 요약 (둘 다 선택됐을 때만)
            └─ "7월 5일 (토) ~ 7월 7일 (월) · 1박 2일" (gray700, fontSize 14)

  [startDate && durationType 모두 선택됐을 때만]
  └─ 하단 고정 CTA: "동행 조건 설정하기"
       - amber500 배경, borderRadius 12
       - onPress: console.log({ startDate, durationType, nights }) — placeholder
```

---

## App.tsx 수정 (화면 전환 연결)

```ts
type Screen = 'region' | 'date';
const [screen, setScreen] = useState<Screen>('region');
const [selectedRegions, setSelectedRegions] = useState<string[]>([]);

// 렌더링
if (screen === 'region')
  return <RegionSelectScreen onContinue={(regions) => { setSelectedRegions(regions); setScreen('date'); }} />;
if (screen === 'date')
  return <TripDateScreen />;
```

**RegionSelectScreen 수정**: CTA `onPress`에 `onContinue(selectedRegions)` 호출 추가, prop 타입 정의.

---

## 날짜 유틸 (screens/TripDateScreen.tsx 내부)

```ts
const getNights = (type: DurationType, custom: number): number => {
  if (type === 'day') return 0;
  if (type === '1night') return 1;
  if (type === '2night') return 2;
  return custom;
};

const getEndDate = (start: Date, nights: number): Date => {
  const end = new Date(start);
  end.setDate(end.getDate() + nights);
  return end;
};

const formatDate = (date: Date): string =>
  date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
```

---

## 검증 방법

1. `bun run start`로 앱 실행
2. RegionSelectScreen에서 지역 선택 후 CTA 탭 → TripDateScreen으로 이동 확인
3. TripDateScreen에서:
   - [ ] 날짜 버튼 탭 시 OS 네이티브 날짜 선택창 열림
   - [ ] 날짜 선택 후 "7월 5일 (토)" 형식으로 표시
   - [ ] 당일치기/1박2일/2박3일 칩 선택 시 amber 강조
   - [ ] 커스텀 선택 시 [−] N박 [+] 카운터 노출
   - [ ] 날짜 + 기간 모두 선택 시 요약 및 CTA 버튼 노출
   - [ ] console.log에 { startDate, durationType, nights } 출력
