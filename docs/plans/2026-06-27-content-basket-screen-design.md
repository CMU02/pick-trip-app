# 콘텐츠 담기 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사용자가 ContentExploreScreen에서 콘텐츠 카드를 탭해 여행 바구니에 추가/제거하고, 2개 이상 담으면 "일정 만들기" CTA가 활성화되는 기능 구현

**Architecture:** ContentExploreScreen 내부에서 `selectedIds: string[]` 상태로 바구니를 관리한다. 카드 탭으로 토글, BottomBar에 담은 수 표시. 우선순위 설정은 별도 기능(다음 이슈)으로 분리.

**Tech Stack:** React Native 0.81.5, Expo SDK 54, styled-components ^6.4.1, TypeScript ~5.9.2

## Global Constraints

- 패키지 매니저: Bun (npm/yarn 사용 금지)
- 스타일: styled-components + COLORS 상수 사용, inline style 지양
- transient props: styled-components에서 `$` 접두사 필수 (`$selected` 등)
- 모든 컴포넌트는 named export (`export function`)

---

## 생성/수정 파일

| 파일 | 작업 |
|------|------|
| `components/molecules/ContentCard.tsx` | 수정 — `selected` prop 추가, 선택 스타일 |
| `screens/ContentExploreScreen.tsx` | 수정 — selectedIds 상태, 토글 핸들러, BottomBar |
| `App.tsx` | 수정 — ContentExploreScreen에 `onContinue` prop 연결 |

---

## Task 1: ContentCard 수정 (`components/molecules/ContentCard.tsx`)

**Files:**
- Modify: `components/molecules/ContentCard.tsx`

**Interfaces:**
- Produces: `ContentCard({ content, selected, onPress })` — ContentExploreScreen에서 사용

- [ ] **Step 1: props에 `selected` 추가, Card에 `$selected` transient prop 적용**

```tsx
// 변경된 인터페이스
interface ContentCardProps {
  content: Content;
  selected?: boolean;
  onPress: () => void;
}

// Card 스타일 수정 ($selected transient prop)
const Card = styled(TouchableOpacity)<{ $selected: boolean }>`
  background-color: ${COLORS.white};
  border-radius: 12px;
  border-width: ${({ $selected }) => ($selected ? '2px' : '1px')};
  border-color: ${({ $selected }) => ($selected ? COLORS.amber500 : COLORS.gray200)};
  overflow: hidden;
  margin-horizontal: 20px;
`;

// Thumbnail 우상단 체크 뱃지 (selected일 때)
const CheckBadge = styled(View)`
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: ${COLORS.amber500};
  border-radius: 100px;
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
`;

const CheckMark = styled(Text)`
  font-size: 13px;
  color: ${COLORS.white};
  font-weight: 700;
`;

// export function 수정
export function ContentCard({ content, selected = false, onPress }: ContentCardProps) {
  const category = CATEGORIES.find((c) => c.id === content.category);

  return (
    <Card $selected={selected} onPress={onPress} activeOpacity={0.8}>
      <Thumbnail $color={content.color}>
        <ThumbnailEmoji>{category?.emoji ?? '📍'}</ThumbnailEmoji>
        {selected && (
          <CheckBadge>
            <CheckMark>✓</CheckMark>
          </CheckBadge>
        )}
      </Thumbnail>
      <Body>
        <CategoryBadge>
          <CategoryLabel>{category?.label ?? content.category}</CategoryLabel>
        </CategoryBadge>
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

## Task 2: ContentExploreScreen 수정 (`screens/ContentExploreScreen.tsx`)

**Files:**
- Modify: `screens/ContentExploreScreen.tsx`

**Interfaces:**
- Consumes: `ContentCard({ selected, onPress })` — Task 1에서 추가된 props
- Produces: `ContentExploreScreen({ selectedRegions, onContinue })` — App.tsx에서 사용

- [ ] **Step 1: Props에 `onContinue` 추가 및 selectedIds 상태 추가**

```tsx
interface ContentExploreScreenProps {
  selectedRegions: string[];
  onContinue: (selectedIds: string[]) => void;
}

// 상태 추가
const [selectedIds, setSelectedIds] = useState<string[]>([]);

// 토글 핸들러
const handleToggle = (contentId: string) => {
  setSelectedIds((prev) =>
    prev.includes(contentId)
      ? prev.filter((id) => id !== contentId)
      : [...prev, contentId],
  );
};
```

- [ ] **Step 2: ContentCard 렌더링 수정**

```tsx
filtered.map((content) => (
  <ContentCard
    key={content.id}
    content={content}
    selected={selectedIds.includes(content.id)}
    onPress={() => handleToggle(content.id)}
  />
))
```

- [ ] **Step 3: BottomBar 스타일 컴포넌트 추가 및 렌더링**

```tsx
const BottomBar = styled(View)`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding-top: 12px;
  padding-horizontal: 20px;
  padding-bottom: 28px;
  background-color: ${COLORS.white};
`;

const BasketCount = styled(Text)`
  font-size: 13px;
  color: ${COLORS.gray500};
  text-align: center;
  margin-bottom: 8px;
`;

const CTAButton = styled(TouchableOpacity)<{ $disabled: boolean }>`
  background-color: ${({ $disabled }) => ($disabled ? COLORS.gray200 : COLORS.amber500)};
  border-radius: 12px;
  padding-vertical: 14px;
  align-items: center;
`;

const CTALabel = styled(Text)`
  color: ${COLORS.white};
  font-size: 16px;
  font-weight: 500;
`;
```

렌더링 (ScreenContainer 내부, ScrollView 아래):

```tsx
{selectedIds.length > 0 && (
  <BottomBar>
    <BasketCount>{selectedIds.length}개 담음</BasketCount>
    <CTAButton
      $disabled={selectedIds.length < 2}
      onPress={() => {
        if (selectedIds.length >= 2) onContinue(selectedIds);
      }}
      activeOpacity={selectedIds.length >= 2 ? 0.8 : 1}
    >
      <CTALabel>
        {selectedIds.length < 2 ? '1개 더 담으면 일정 생성 가능' : '일정 만들기'}
      </CTALabel>
    </CTAButton>
  </BottomBar>
)}
```

- [ ] **Step 4: ScrollView paddingBottom 조정**

```tsx
<ScrollView
  showsVerticalScrollIndicator={false}
  contentContainerStyle={{ paddingBottom: selectedIds.length > 0 ? 120 : 40 }}
>
```

- [ ] **Step 5: 타입 검사**

```
bunx tsc --noEmit
```

기대 출력: 에러 없음

---

## Task 3: App.tsx 수정

**Files:**
- Modify: `App.tsx`

- [ ] **Step 1: ContentExploreScreen에 `onContinue` prop 추가**

```tsx
return (
  <ContentExploreScreen
    selectedRegions={selectedRegions}
    onContinue={(selectedIds) => {
      console.log({ selectedRegions, selectedIds });
      // 추후 우선순위 설정 화면으로 연결
    }}
  />
);
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
- [ ] 카드 탭 시 amber 테두리 + 우상단 ✓ 뱃지 표시 확인
- [ ] 담긴 카드 재탭 시 선택 해제(테두리/뱃지 사라짐) 확인
- [ ] BottomBar "X개 담음" 카운트 정확히 표시
- [ ] 1개 담을 때 CTA 회색 + "1개 더 담으면 일정 생성 가능"
- [ ] 2개 이상 담을 때 CTA amber500 + "일정 만들기" 활성화
- [ ] "일정 만들기" 탭 시 console.log에 selectedIds 배열 출력 확인
