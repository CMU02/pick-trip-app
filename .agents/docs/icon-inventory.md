# 아이콘 사용 목록 (웹팀 전달용)

앱(`pick-trip-app`)은 아이콘을 **`@expo/vector-icons`의 `Ionicons` 하나로 통일**해서 씁니다
(`types/icon.ts` — 존재하지 않는 아이콘 이름을 쓰면 타입 에러로 잡히도록 강제해둠).

`@expo/vector-icons`의 `Ionicons`는 [Ionic 팀의 오픈소스 아이콘 세트](https://ionic.io/ionicons)를
그대로 감싼 것이라, 웹에서도 **이름을 그대로 맞추면 동일한 모양의 아이콘**을 쓸 수 있습니다.

- 웹 옵션 A: [`ionicons`](https://www.npmjs.com/package/ionicons) 공식 웹 컴포넌트 패키지 — 이름 100% 동일
- 웹 옵션 B: [`react-icons/io5`](https://react-icons.github.io/react-icons/icons/io5/) — React 프로젝트면 더 흔히 씀, 이름 거의 동일(접두사만 `Io5` 붙는 방식)

이름 규칙: 채워진 아이콘은 `아이콘명`, 테두리만 있는 버전은 `아이콘명-outline` (예: `heart` / `heart-outline`).

---

## 1. 카테고리 아이콘 (`constants/categories.ts`)

콘텐츠 카테고리 필터, 콘텐츠 카드 뱃지 등 여러 화면에서 재사용.

| 카테고리 | 아이콘 이름 | 색상 |
| --- | --- | --- |
| 전체 | `map-outline` | `#9CA3AF` (gray400) |
| 음식 | `restaurant-outline` | `#FF8F00` |
| 축제 | `sparkles-outline` | `#E91E63` |
| 관광명소 | `compass-outline` | `#42A5F5` |
| 문화 | `library-outline` | `#795548` |
| 자연 | `leaf-outline` | `#4CAF50` |
| 체험 | `color-palette-outline` | `#5C6BC0` |

## 2. 동행 유형 아이콘 (`constants/companions.ts`)

| 동행 유형 | 아이콘 이름 |
| --- | --- |
| 아이와 함께 | `happy-outline` |
| 부모님과 함께 | `person-outline` |
| 가족 전체 | `people-outline` |

## 3. 하단 탭바 (`components/molecules/TabBar.tsx`)

탭마다 선택/비선택 상태에 따라 채워진 버전 ↔ 테두리 버전을 전환.

| 탭 | 선택됨 | 선택 안 됨 |
| --- | --- | --- |
| 홈 | `home` | `home-outline` |
| 탐색 | `search` | `search-outline` |
| 바구니 | `bookmark` | `bookmark-outline` |
| 내 정보 | `person` | `person-outline` |

## 4. 찜하기 (`components/atoms/FavoriteButton.tsx`)

| 상태 | 아이콘 이름 |
| --- | --- |
| 찜함 | `heart` |
| 찜 안 함 | `heart-outline` |

## 5. 공통 UI 아이콘

여러 화면에 흩어져 쓰이는 아이콘들. 용도별로 정리.

| 아이콘 이름 | 용도 | 주요 사용 위치 |
| --- | --- | --- |
| `chevron-back` | 헤더 뒤로가기 | `RootNavigator.tsx` |
| `chevron-forward` | 다음/이동 | `ProfileContent.tsx`, `ContentCard.tsx` |
| `chevron-down-outline` | 드롭다운 펼치기 | `PrioritySelectScreen.tsx`, `HomeContent.tsx` |
| `close` | 닫기 / 검색어 지우기 | `ContentDetailModal.tsx`, `ContentExploreScreen.tsx` |
| `checkmark` | 선택 완료 표시 | `PrioritySelectScreen.tsx`, `ProgressChecklist.tsx`, `ContentCard.tsx`, `ItineraryResultScreen.tsx` |
| `location-outline` | 주소/위치 | `ContentDetailModal.tsx`, `PrioritySelectScreen.tsx`, `ItineraryResultScreen.tsx`, `HomeContent.tsx`, `ContentCard.tsx` |
| `home-outline` | 실내 여부 표시 | `ContentDetailModal.tsx`, `ContentCard.tsx` |
| `trash-outline` | 삭제 | `ProfileContent.tsx`, `HomeContent.tsx` |
| `bulb-outline` | 팁 안내 | `PrioritySelectScreen.tsx` |
| `search-outline` | 검색창 | `ContentExploreScreen.tsx` |
| `calendar-outline` | 날짜 표시 | `ItineraryResultScreen.tsx`, `HomeContent.tsx` |
| `sparkles` | AI 생성 표시 | `ItineraryResultScreen.tsx` |
| `share-outline` | 공유 | `ItineraryResultScreen.tsx` |
| `hand-right-outline` | 환영 인사 제스처 | `HomeContent.tsx` |
| `briefcase-outline` | 여행 목적/동행 | `HomeContent.tsx` |
| `people-outline` | 인원 | `HomeContent.tsx` (동행 유형과 동일 아이콘) |
| `arrow-forward` | 다음 진행 | `AuthScreen.tsx` |

---

## 전체 고유 아이콘 이름 (알파벳순, 총 33개)

```
arrow-forward
bookmark
bookmark-outline
briefcase-outline
bulb-outline
calendar-outline
checkmark
chevron-back
chevron-down-outline
chevron-forward
close
color-palette-outline
compass-outline
hand-right-outline
happy-outline
heart
heart-outline
home
home-outline
leaf-outline
library-outline
location-outline
map-outline
people-outline
person
person-outline
restaurant-outline
search
search-outline
share-outline
sparkles
sparkles-outline
trash-outline
```

> 갱신: 새 아이콘을 추가할 때는 `types/icon.ts`의 `IoniconName` 타입 덕분에 앱 코드에서는
> 오타가 자동으로 잡히지만, 이 문서는 수동으로 갱신해야 합니다. 아이콘을 추가/변경하면 이 파일도 같이 업데이트해 주세요.
