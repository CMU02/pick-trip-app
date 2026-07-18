# RegionSelectScreen 설계 명세

## Context

PickTrip 앱의 첫 번째 사용자 흐름 단계. 사용자가 하동·영주·예천 중 1개 이상의 지역을 선택하면, 이후 해당 지역의 콘텐츠를 탐색할 수 있다. 디자인은 `Downloads/PickTrip/` 프로토타입(components.jsx + PickTrip UI.html)을 기준으로 한다.

---

## 구현 범위

- 지역 선택 화면(RegionSelectScreen)만 구현
- `selectedRegions`는 화면 내 `useState`로 관리 (Zustand는 네비게이션 연결 시 도입)
- `App.tsx`에서 직접 렌더링 (React Navigation 미포함)

---

## 파일 구조

```
constants/
  colors.ts              # 프로토타입 COLORS 팔레트 (amber, teal, gray)
  regions.ts             # REGIONS 데이터 배열

types/
  region.ts              # Region 인터페이스

components/
  atoms/
    Badge.tsx            # 재사용 태그 뱃지
  molecules/
    RegionCard.tsx       # 지역 선택 카드

screens/
  RegionSelectScreen.tsx # 메인 화면

App.tsx                  # RegionSelectScreen 렌더링
```

---

## 타입

```ts
// types/region.ts
export interface Region {
  id: string;
  name: string;
  tagline: string;
  tags: string[];
  color: string;  // 이미지 플레이스홀더 그라디언트 색상
}
```

---

## 상수

### constants/colors.ts

프로토타입 COLORS 객체 기반:

| 토큰 | 값 | 용도 |
|---|---|---|
| `amber50` | `#FFF8E1` | 선택된 카드 배경 |
| `amber100` | `#FFECB3` | 선택된 카드 하단 구분선 |
| `amber300` | `#FFD166` | — |
| `amber500` | `#F59E0B` | 선택 테두리, CTA 버튼 |
| `amber600` | `#D97706` | "선택됨" 텍스트 |
| `amber700` | `#B45309` | — |
| `gray50` | `#F9FAFB` | 화면 배경 |
| `gray100` | `#F3F4F6` | 기본 뱃지 배경 |
| `gray200` | `#E5E7EB` | 카드 기본 테두리 |
| `gray500` | `#6B7280` | 태그라인, 뱃지 텍스트 |
| `gray700` | `#374151` | 뱃지 텍스트 (강조) |
| `gray900` | `#111827` | 제목, 카드 이름 |
| `white` | `#FFFFFF` | 카드 기본 배경 |

### constants/regions.ts

```ts
export const REGIONS: Region[] = [
  { id: 'hadong',  name: '하동',  tagline: '섬진강과 녹차밭의 고장',  tags: ['녹차체험', '섬진강', '벚꽃'],       color: '#4a7c59' },
  { id: 'yeongju', name: '영주', tagline: '선비문화와 사과의 도시',   tags: ['부석사', '소수서원', '사과'],       color: '#8b6914' },
  { id: 'yecheon', name: '예천', tagline: '물과 숲이 어우러진 고장',  tags: ['회룡포', '삼강주막', '자연'],      color: '#2d6a8f' },
];
```

---

## 컴포넌트 명세

### Badge (atoms/Badge.tsx)

```ts
interface BadgeProps {
  label: string;
  color?: string;   // 텍스트 색상, 기본 gray700
  bg?: string;      // 배경 색상, 기본 gray100
}
```

- 둥근 알약형 태그 (borderRadius: 100)
- fontSize: 12, fontWeight: 500, padding: 2px 8px

---

### RegionCard (molecules/RegionCard.tsx)

```ts
interface RegionCardProps {
  region: Region;
  selected: boolean;
  onPress: () => void;
}
```

**레이아웃 (위→아래):**

1. **이미지 영역** (height: 100)
   - `linear-gradient(135deg, ${region.color}44, ${region.color}22)` 배경
   - 텍스트: `${region.name} 대표 이미지` (플레이스홀더)

2. **카드 본문** (padding: 16)
   - 이름: fontSize 20, fontWeight 500
   - 태그라인: fontSize 14, color gray500, marginBottom 12
   - Badge 배열: `region.tags` 순회, color=gray700, bg=gray100

3. **선택됨 표시** (selected일 때만)
   - borderTop: amber100
   - padding: 8 16 12
   - `✓ 선택됨` 텍스트, color amber700

**선택 상태:**
- 기본: border `2px solid gray200`, background white
- 선택: border `2px solid amber500`, background amber50

---

### RegionSelectScreen (screens/RegionSelectScreen.tsx)

**상태:**
```ts
const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
```

**토글 함수:**
```ts
const handleToggleRegion = (id: string) => {
  setSelectedRegions(prev =>
    prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
  );
};
```

**레이아웃:**

```
SafeAreaView (flex:1, background gray50)
  └─ ScrollView (contentPadding: 0 0 120 0)
       ├─ 헤더 영역 (padding: 24 20 8)
       │    ├─ "어디로 떠나볼까요?" (fontSize 24, fontWeight 500)
       │    └─ "가고 싶은 지역을 선택하세요" (fontSize 15, gray500)
       └─ 카드 목록 (padding: 0 20, gap 16)
            └─ RegionCard × 3
  
  [selectedRegions.length > 0일 때만]
  └─ 하단 고정 영역 (position absolute, bottom 0)
       └─ CTA 버튼: "{N}개 지역 콘텐츠 보기"
            - background amber500, color white
            - borderRadius 12, padding: 14 0
            - fontSize 16, fontWeight 500
            - onPress: console.log(selectedRegions) — 네비게이션 연결 전 placeholder
```

---

## 검증 방법

1. `bun run start` (또는 `npx expo start`) 으로 앱 실행
2. 시뮬레이터/기기에서 확인:
   - [ ] 3개 지역 카드가 세로로 나열됨
   - [ ] 카드 탭 시 amber 테두리 + "선택됨" 표시
   - [ ] 재탭 시 선택 해제
   - [ ] 1개 이상 선택 시 하단 CTA 버튼 노출, 선택 수 반영
   - [ ] 전체 해제 시 CTA 버튼 사라짐
   - [ ] 복수 선택 (예: 하동+영주 동시 선택) 가능
