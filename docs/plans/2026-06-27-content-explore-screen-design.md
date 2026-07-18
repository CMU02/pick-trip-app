# ContentExploreScreen 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사용자가 선택한 지역의 콘텐츠 카드를 탐색하고, 카테고리 필터 및 텍스트 검색으로 원하는 콘텐츠를 찾을 수 있는 화면 구현

**Architecture:** 선택된 지역 ID 배열로 콘텐츠를 필터링하고, 카테고리 칩과 텍스트 검색을 조합한 클라이언트 사이드 필터링으로 동작한다. 콘텐츠 데이터는 Mock 데이터(15개, 지역당 5개)를 사용한다.

**Tech Stack:** React Native 0.81.5, Expo SDK 54, styled-components ^6.4.1, TypeScript ~5.9.2

## Global Constraints

- 패키지 매니저: Bun (npm/yarn 사용 금지)
- 스타일: styled-components + COLORS 상수 (`constants/colors.ts`) 사용, inline style 지양
- transient props: styled-components에서 `$` 접두사 필수 (`$selected`, `$active` 등)
- 새 색상 추가 금지 — `COLORS` 객체 내 기존 색상만 사용
- 카테고리 이모지/레이블은 `constants/categories.ts`에 중앙 관리
- 모든 컴포넌트는 named export (`export function`)
- `border-width: 2px`, `border-radius: 12px` (카드), `border-radius: 100px` (뱃지) 통일

---

## 생성/수정 파일

| 파일 | 작업 |
|------|------|
| `types/content.ts` | 신규 — ContentCategory, Content 인터페이스 |
| `constants/categories.ts` | 신규 — CATEGORIES 배열 (id, label, emoji) |
| `constants/contents.ts` | 신규 — CONTENTS Mock 데이터 15개 |
| `components/molecules/ContentCard.tsx` | 신규 — 콘텐츠 카드 |
| `components/molecules/CategoryFilter.tsx` | 신규 — 카테고리 칩 필터 |
| `screens/ContentExploreScreen.tsx` | 신규 — 탐색/검색 메인 화면 |
| `screens/CompanionSelectScreen.tsx` | 수정 — onContinue prop 타입에 CompanionType[] 전달 확인 |
| `App.tsx` | 수정 — Screen에 `'explore'` 추가, CompanionSelectScreen onContinue 연결 |

---

## Task 1: 타입 정의 (`types/content.ts`, `constants/categories.ts`)

**Files:**
- Create: `types/content.ts`
- Create: `constants/categories.ts`

**Interfaces:**
- Produces: `ContentCategory`, `Content`, `Category` — Task 2, 3, 4, 5에서 사용

- [ ] **Step 1: `types/content.ts` 작성**

```ts
export type ContentCategory =
  | 'food'
  | 'festival'
  | 'nature'
  | 'culture'
  | 'experience'
  | 'market'
  | 'indoor';

export interface Content {
  id: string;
  regionId: string;
  name: string;
  category: ContentCategory;
  tagline: string;
  duration: string;
  parking: boolean;
  kidsRecommended: boolean;
  seniorsRecommended: boolean;
  indoor: boolean;
  color: string;
}
```

- [ ] **Step 2: `constants/categories.ts` 작성**

```ts
import type { ContentCategory } from '../types/content';

export interface Category {
  id: ContentCategory | 'all';
  label: string;
  emoji: string;
}

export const CATEGORIES: Category[] = [
  { id: 'all',        label: '전체',   emoji: '🗺️' },
  { id: 'food',       label: '음식',   emoji: '🍜' },
  { id: 'festival',   label: '축제',   emoji: '🎉' },
  { id: 'nature',     label: '자연',   emoji: '🌿' },
  { id: 'culture',    label: '문화',   emoji: '🏛️' },
  { id: 'experience', label: '체험',   emoji: '🎨' },
  { id: 'market',     label: '시장',   emoji: '🛍️' },
  { id: 'indoor',     label: '실내',   emoji: '🏠' },
];
```

- [ ] **Step 3: 타입 검사**

```
bunx tsc --noEmit
```

기대 출력: 에러 없음

---

## Task 2: Mock 콘텐츠 데이터 (`constants/contents.ts`)

**Files:**
- Create: `constants/contents.ts`

**Interfaces:**
- Consumes: `Content` (types/content.ts)
- Produces: `CONTENTS: Content[]` — ContentExploreScreen에서 필터링에 사용

- [ ] **Step 1: `constants/contents.ts` 작성**

```ts
import type { Content } from '../types/content';

export const CONTENTS: Content[] = [
  // ─── 하동 (regionId: 'hadong') ────────────────────────────────────────
  {
    id: 'hadong-1',
    regionId: 'hadong',
    name: '화개장터',
    category: 'market',
    tagline: '섬진강변의 오랜 전통시장, 재첩국과 벚꽃길이 유명해요',
    duration: '1~2시간',
    parking: true,
    kidsRecommended: true,
    seniorsRecommended: true,
    indoor: false,
    color: '#4CAF50',
  },
  {
    id: 'hadong-2',
    regionId: 'hadong',
    name: '최참판댁',
    category: 'culture',
    tagline: '토지 소설의 배경이 된 대저택, 드라마 세트장으로도 유명해요',
    duration: '1~2시간',
    parking: true,
    kidsRecommended: true,
    seniorsRecommended: true,
    indoor: false,
    color: '#795548',
  },
  {
    id: 'hadong-3',
    regionId: 'hadong',
    name: '하동 야생차 체험관',
    category: 'experience',
    tagline: '하동 녹차의 고장에서 직접 차를 덖고 마시는 체험',
    duration: '2~3시간',
    parking: true,
    kidsRecommended: true,
    seniorsRecommended: true,
    indoor: true,
    color: '#388E3C',
  },
  {
    id: 'hadong-4',
    regionId: 'hadong',
    name: '섬진강 자연관찰로',
    category: 'nature',
    tagline: '섬진강을 따라 걷는 평탄한 산책로, 봄 벚꽃이 절경이에요',
    duration: '1~2시간',
    parking: true,
    kidsRecommended: true,
    seniorsRecommended: true,
    indoor: false,
    color: '#03A9F4',
  },
  {
    id: 'hadong-5',
    regionId: 'hadong',
    name: '하동 재첩 한정식',
    category: 'food',
    tagline: '섬진강 재첩으로 만든 하동 대표 향토 음식',
    duration: '1시간',
    parking: false,
    kidsRecommended: false,
    seniorsRecommended: true,
    indoor: true,
    color: '#FF8F00',
  },

  // ─── 영주 (regionId: 'yeongju') ───────────────────────────────────────
  {
    id: 'yeongju-1',
    regionId: 'yeongju',
    name: '부석사',
    category: 'culture',
    tagline: '유네스코 세계유산, 한국에서 가장 아름다운 사찰 중 하나예요',
    duration: '1~2시간',
    parking: true,
    kidsRecommended: true,
    seniorsRecommended: true,
    indoor: false,
    color: '#FF7043',
  },
  {
    id: 'yeongju-2',
    regionId: 'yeongju',
    name: '소수서원',
    category: 'culture',
    tagline: '조선 최초의 서원, 선비 문화의 발상지를 걸어봐요',
    duration: '1시간',
    parking: true,
    kidsRecommended: true,
    seniorsRecommended: true,
    indoor: false,
    color: '#8D6E63',
  },
  {
    id: 'yeongju-3',
    regionId: 'yeongju',
    name: '선비촌',
    category: 'experience',
    tagline: '전통 한옥마을에서 선비 생활 체험과 전통 공예를 즐겨요',
    duration: '2~3시간',
    parking: true,
    kidsRecommended: true,
    seniorsRecommended: true,
    indoor: false,
    color: '#5C6BC0',
  },
  {
    id: 'yeongju-4',
    regionId: 'yeongju',
    name: '무섬마을',
    category: 'nature',
    tagline: '물 위에 뜬 섬처럼 강이 마을을 감싸 안은 비경',
    duration: '1~2시간',
    parking: true,
    kidsRecommended: true,
    seniorsRecommended: true,
    indoor: false,
    color: '#26C6DA',
  },
  {
    id: 'yeongju-5',
    regionId: 'yeongju',
    name: '영주 한우 구이',
    category: 'food',
    tagline: '청정 자연에서 자란 영주 한우, 특유의 마블링이 일품이에요',
    duration: '1시간',
    parking: true,
    kidsRecommended: false,
    seniorsRecommended: true,
    indoor: true,
    color: '#EF5350',
  },

  // ─── 예천 (regionId: 'yecheon') ───────────────────────────────────────
  {
    id: 'yecheon-1',
    regionId: 'yecheon',
    name: '회룡포',
    category: 'nature',
    tagline: '강이 마을을 360도로 감싸는 예천의 가장 아름다운 경관',
    duration: '1~2시간',
    parking: true,
    kidsRecommended: true,
    seniorsRecommended: false,
    indoor: false,
    color: '#42A5F5',
  },
  {
    id: 'yecheon-2',
    regionId: 'yecheon',
    name: '삼강주막',
    category: 'culture',
    tagline: '100년 역사의 전통 주막, 막걸리 한 잔과 함께 옛 정취를 느껴요',
    duration: '30분~1시간',
    parking: true,
    kidsRecommended: false,
    seniorsRecommended: true,
    indoor: true,
    color: '#A1887F',
  },
  {
    id: 'yecheon-3',
    regionId: 'yecheon',
    name: '예천 활 체험장',
    category: 'experience',
    tagline: '전국 유일 활의 고장 예천에서 전통 국궁을 직접 체험해봐요',
    duration: '1~2시간',
    parking: true,
    kidsRecommended: true,
    seniorsRecommended: false,
    indoor: false,
    color: '#66BB6A',
  },
  {
    id: 'yecheon-4',
    regionId: 'yecheon',
    name: '초간정',
    category: 'nature',
    tagline: '기암괴석과 맑은 계곡 위에 자리한 아름다운 정자',
    duration: '30분~1시간',
    parking: true,
    kidsRecommended: true,
    seniorsRecommended: true,
    indoor: false,
    color: '#26A69A',
  },
  {
    id: 'yecheon-5',
    regionId: 'yecheon',
    name: '예천 한우불고기',
    category: 'food',
    tagline: '예천 청정 한우로 만든 달콤한 양념 불고기',
    duration: '1시간',
    parking: true,
    kidsRecommended: true,
    seniorsRecommended: true,
    indoor: true,
    color: '#FFA726',
  },
];
```

- [ ] **Step 2: 타입 검사**

```
bunx tsc --noEmit
```

기대 출력: 에러 없음

---

## Task 3: ContentCard 컴포넌트 (`components/molecules/ContentCard.tsx`)

**Files:**
- Create: `components/molecules/ContentCard.tsx`

**Interfaces:**
- Consumes: `Content` (types/content.ts), `CATEGORIES` (constants/categories.ts), `COLORS` (constants/colors.ts)
- Produces: `ContentCard({ content, onPress })` — ContentExploreScreen에서 사용

- [ ] **Step 1: `components/molecules/ContentCard.tsx` 작성**

```tsx
import { View, Text, TouchableOpacity } from 'react-native';
import styled from 'styled-components';
import { COLORS } from '../../constants/colors';
import { CATEGORIES } from '../../constants/categories';
import type { Content } from '../../types/content';

interface ContentCardProps {
  content: Content;
  onPress: () => void;
}

const Card = styled(TouchableOpacity)`
  background-color: ${COLORS.white};
  border-radius: 12px;
  border-width: 1px;
  border-color: ${COLORS.gray200};
  overflow: hidden;
  margin-horizontal: 20px;
`;

const Thumbnail = styled(View)<{ $color: string }>`
  height: 100px;
  background-color: ${({ $color }) => `${$color}33`};
  align-items: center;
  justify-content: center;
`;

const ThumbnailEmoji = styled(Text)`
  font-size: 36px;
`;

const Body = styled(View)`
  padding: 14px 16px 16px;
`;

const CategoryRow = styled(View)`
  flex-direction: row;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
`;

const CategoryBadge = styled(View)`
  background-color: ${COLORS.amber50};
  border-radius: 100px;
  padding-vertical: 2px;
  padding-horizontal: 8px;
`;

const CategoryLabel = styled(Text)`
  font-size: 12px;
  font-weight: 500;
  color: ${COLORS.amber700};
`;

const ContentName = styled(Text)`
  font-size: 16px;
  font-weight: 600;
  color: ${COLORS.gray900};
  margin-bottom: 4px;
`;

const Tagline = styled(Text)`
  font-size: 13px;
  color: ${COLORS.gray500};
  line-height: 18px;
  margin-bottom: 12px;
`;

const InfoRow = styled(View)`
  flex-direction: row;
  gap: 10px;
`;

const InfoChip = styled(View)`
  flex-direction: row;
  align-items: center;
  gap: 3px;
`;

const InfoEmoji = styled(Text)`
  font-size: 13px;
`;

const InfoText = styled(Text)`
  font-size: 12px;
  color: ${COLORS.gray500};
`;

export function ContentCard({ content, onPress }: ContentCardProps) {
  const category = CATEGORIES.find((c) => c.id === content.category);

  return (
    <Card onPress={onPress} activeOpacity={0.8}>
      <Thumbnail $color={content.color}>
        <ThumbnailEmoji>{category?.emoji ?? '📍'}</ThumbnailEmoji>
      </Thumbnail>
      <Body>
        <CategoryRow>
          <CategoryBadge>
            <CategoryLabel>{category?.label ?? content.category}</CategoryLabel>
          </CategoryBadge>
        </CategoryRow>
        <ContentName>{content.name}</ContentName>
        <Tagline numberOfLines={2}>{content.tagline}</Tagline>
        <InfoRow>
          <InfoChip>
            <InfoEmoji>⏱️</InfoEmoji>
            <InfoText>{content.duration}</InfoText>
          </InfoChip>
          {content.parking && (
            <InfoChip>
              <InfoEmoji>🅿️</InfoEmoji>
              <InfoText>주차 가능</InfoText>
            </InfoChip>
          )}
          {content.kidsRecommended && (
            <InfoChip>
              <InfoEmoji>👶</InfoEmoji>
              <InfoText>아이 추천</InfoText>
            </InfoChip>
          )}
          {content.seniorsRecommended && (
            <InfoChip>
              <InfoEmoji>👴</InfoEmoji>
              <InfoText>부모님 추천</InfoText>
            </InfoChip>
          )}
          {content.indoor && (
            <InfoChip>
              <InfoEmoji>🏠</InfoEmoji>
              <InfoText>실내</InfoText>
            </InfoChip>
          )}
        </InfoRow>
      </Body>
    </Card>
  );
}
```

- [ ] **Step 2: 타입 검사**

```
bunx tsc --noEmit
```

기대 출력: 에러 없음

---

## Task 4: CategoryFilter 컴포넌트 (`components/molecules/CategoryFilter.tsx`)

**Files:**
- Create: `components/molecules/CategoryFilter.tsx`

**Interfaces:**
- Consumes: `CATEGORIES`, `Category` (constants/categories.ts), `COLORS`
- Produces: `CategoryFilter({ selected, onSelect })` — ContentExploreScreen에서 사용

- [ ] **Step 1: `components/molecules/CategoryFilter.tsx` 작성**

```tsx
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import styled from 'styled-components';
import { COLORS } from '../../constants/colors';
import { CATEGORIES } from '../../constants/categories';
import type { ContentCategory } from '../../types/content';

interface CategoryFilterProps {
  selected: ContentCategory | 'all';
  onSelect: (id: ContentCategory | 'all') => void;
}

const Chip = styled(TouchableOpacity)<{ $active: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: 4px;
  padding-vertical: 7px;
  padding-horizontal: 14px;
  border-radius: 100px;
  border-width: 1px;
  background-color: ${({ $active }) => ($active ? COLORS.amber500 : COLORS.white)};
  border-color: ${({ $active }) => ($active ? COLORS.amber500 : COLORS.gray200)};
`;

const ChipEmoji = styled(Text)`
  font-size: 13px;
`;

const ChipLabel = styled(Text)<{ $active: boolean }>`
  font-size: 13px;
  font-weight: ${({ $active }) => ($active ? '600' : '400')};
  color: ${({ $active }) => ($active ? COLORS.white : COLORS.gray700)};
`;

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingVertical: 4 }}
    >
      {CATEGORIES.map((cat) => (
        <Chip
          key={cat.id}
          $active={selected === cat.id}
          onPress={() => onSelect(cat.id as ContentCategory | 'all')}
          activeOpacity={0.8}
        >
          <ChipEmoji>{cat.emoji}</ChipEmoji>
          <ChipLabel $active={selected === cat.id}>{cat.label}</ChipLabel>
        </Chip>
      ))}
    </ScrollView>
  );
}
```

- [ ] **Step 2: 타입 검사**

```
bunx tsc --noEmit
```

기대 출력: 에러 없음

---

## Task 5: ContentExploreScreen (`screens/ContentExploreScreen.tsx`)

**Files:**
- Create: `screens/ContentExploreScreen.tsx`

**Interfaces:**
- Consumes: `CONTENTS`, `ContentCard`, `CategoryFilter`, `COLORS`, `Content`, `ContentCategory`
- Produces: `ContentExploreScreen({ selectedRegions, onContinue })` — App.tsx에서 사용

**필터링 로직:**
1. `selectedRegions`에 포함된 regionId만 표시
2. 선택된 카테고리가 `'all'`이 아니면 category 필터링
3. `searchQuery`가 있으면 `content.name.includes(query)` 필터링
4. 세 조건을 AND로 조합

- [ ] **Step 1: `screens/ContentExploreScreen.tsx` 작성**

```tsx
import { useState, useMemo } from 'react';
import { SafeAreaView, ScrollView, View, Text, TextInput } from 'react-native';
import styled from 'styled-components';
import { COLORS } from '../constants/colors';
import { CONTENTS } from '../constants/contents';
import { ContentCard } from '../components/molecules/ContentCard';
import { CategoryFilter } from '../components/molecules/CategoryFilter';
import type { ContentCategory } from '../types/content';

interface ContentExploreScreenProps {
  selectedRegions: string[];
}

const ScreenContainer = styled(SafeAreaView)`
  flex: 1;
  background-color: ${COLORS.gray50};
`;

const Header = styled(View)`
  padding-top: 24px;
  padding-horizontal: 20px;
  padding-bottom: 12px;
`;

const Title = styled(Text)`
  font-size: 24px;
  font-weight: 500;
  color: ${COLORS.gray900};
`;

const Subtitle = styled(Text)`
  font-size: 15px;
  color: ${COLORS.gray500};
  margin-top: 6px;
`;

const SearchBox = styled(TextInput)`
  background-color: ${COLORS.white};
  border-width: 1px;
  border-color: ${COLORS.gray200};
  border-radius: 12px;
  padding-vertical: 12px;
  padding-horizontal: 16px;
  font-size: 15px;
  color: ${COLORS.gray900};
  margin-top: 14px;
`;

const FilterRow = styled(View)`
  padding-vertical: 12px;
`;

const CardList = styled(View)`
  gap: 12px;
  padding-bottom: 40px;
`;

const EmptyText = styled(Text)`
  font-size: 15px;
  color: ${COLORS.gray500};
  text-align: center;
  margin-top: 60px;
`;

export function ContentExploreScreen({ selectedRegions }: ContentExploreScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<ContentCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    return CONTENTS.filter((c) => {
      const inRegion = selectedRegions.includes(c.regionId);
      const inCategory = selectedCategory === 'all' || c.category === selectedCategory;
      const inSearch = searchQuery.trim() === '' || c.name.includes(searchQuery.trim());
      return inRegion && inCategory && inSearch;
    });
  }, [selectedRegions, selectedCategory, searchQuery]);

  return (
    <ScreenContainer>
      <Header>
        <Title>어떤 곳이 끌리나요?</Title>
        <Subtitle>마음에 드는 콘텐츠를 찾아보세요</Subtitle>
        <SearchBox
          placeholder="장소 이름으로 검색"
          placeholderTextColor={COLORS.gray500}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </Header>
      <FilterRow>
        <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />
      </FilterRow>
      <ScrollView showsVerticalScrollIndicator={false}>
        <CardList>
          {filtered.length === 0 ? (
            <EmptyText>조건에 맞는 콘텐츠가 없어요</EmptyText>
          ) : (
            filtered.map((content) => (
              <ContentCard
                key={content.id}
                content={content}
                onPress={() => console.log('selected:', content.id)}
              />
            ))
          )}
        </CardList>
      </ScrollView>
    </ScreenContainer>
  );
}
```

- [ ] **Step 2: 타입 검사**

```
bunx tsc --noEmit
```

기대 출력: 에러 없음

---

## Task 6: App.tsx 수정

**Files:**
- Modify: `App.tsx`

**Interfaces:**
- Consumes: `ContentExploreScreen` (screens/ContentExploreScreen.tsx)
- Produces: `'explore'` Screen 전환 완성

- [ ] **Step 1: App.tsx 수정**

기존 `App.tsx` 전체를 아래로 교체:

```tsx
import { useState } from 'react';
import { RegionSelectScreen } from './screens/RegionSelectScreen';
import { TripDateScreen } from './screens/TripDateScreen';
import { CompanionSelectScreen } from './screens/CompanionSelectScreen';
import { ContentExploreScreen } from './screens/ContentExploreScreen';
import type { CompanionType } from './types/companion';

type Screen = 'region' | 'date' | 'companion' | 'explore';

export default function App() {
  const [screen, setScreen] = useState<Screen>('region');
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [tripDate, setTripDate] = useState<{
    startDate: Date;
    durationType: string;
    nights: number;
  } | null>(null);

  if (screen === 'region') {
    return (
      <RegionSelectScreen
        onContinue={(regions) => {
          setSelectedRegions(regions);
          setScreen('date');
        }}
      />
    );
  }

  if (screen === 'date') {
    return (
      <TripDateScreen
        onContinue={(date) => {
          setTripDate(date);
          setScreen('companion');
        }}
      />
    );
  }

  if (screen === 'companion') {
    return (
      <CompanionSelectScreen
        onContinue={(_companions: CompanionType[]) => {
          setScreen('explore');
        }}
      />
    );
  }

  return <ContentExploreScreen selectedRegions={selectedRegions} />;
}
```

- [ ] **Step 2: 타입 검사 + 테스트**

```
bunx tsc --noEmit
bun run test:run
```

기대 출력: 에러 없음, 테스트 4개 통과

---

## 검증 체크리스트

- [ ] `bun run start -- --clear`로 앱 실행
- [ ] 지역 선택 → 날짜 → 동행 조건 → ContentExploreScreen 이동 확인
- [ ] 선택한 지역(예: 하동만 선택 시)의 콘텐츠만 표시 확인
- [ ] 카테고리 칩 탭 시 해당 카테고리만 필터링 확인
- [ ] "전체" 칩으로 복귀 시 전체 콘텐츠 노출 확인
- [ ] 텍스트 검색 입력 시 이름 포함 항목만 노출 확인
- [ ] 검색어 + 카테고리 조합 필터 동작 확인
- [ ] 결과 없을 때 "조건에 맞는 콘텐츠가 없어요" 문구 표시 확인
- [ ] ContentCard의 썸네일 이모지, 카테고리 뱃지, 이름, 태그라인, 정보 아이콘 정상 표시 확인
