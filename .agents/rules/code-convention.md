# Code Convention

## Naming Rules

- Component File / Name: `PascalCase`
  - Examples: `UserProfileCard.tsx`, `AppHeader.tsx`
- General Functions and Variables: `camelCase`
  - Examples: `fetchUserData`, `handleProfileSubmit`
- Constants:
  - Global/Fixed Values: `UPPER_SNAKE_CASE`
    - Examples: `API_URL`, `MAX_RETRY_COUNT`
  - RunTime Constants: `camelCase`
    - Examples: `baseUrl`, `defaultTimeout`
- Event Handlers: `handle + 동작` 형식으로 작성한다.
  - Examples: `handleLogin`, `handleImageUpload`
- Asynchronous Functions: prefixes such as `get`, `fetch`, `load`, etc.
  - Examples: `fetchPosts`, `getProfileInfo`

## File Structure and Directories

```text
.
├── components/
│   ├── atoms
│   ├── molecules
│   └── organisms
├── screens/
│   ├── HomeScreen.tsx
│   └── ProfileScreen.tsx
├── navigation/
│   ├── AppNavigator.tsx
│   └── MainStack.tsx
├── services/
│   ├── authService.ts
│   └── postService.ts
├── store
├── hooks/
│   ├── useAuth.ts
│   └── useFetchPosts.ts
├── types/
│   ├── trip.ts
│   └── user.ts
├── constants/
│   ├── regions.ts
│   └── api.ts
├── utils
├── assets
└── App.tsx
```

- `components/`: UI 컴포넌트
- `screens/`: 화면 단위 컴포넌트
- `services/`: API, 비즈니스 로직
- `store/`: 상태관리 (Redux, Zustand 등)
- `hooks/`: 커스텀 훅
- `types/`: 전역 타입 및 인터페이스 정의
- `constants/`: 전역 상수 (지역 코드, API 엔드포인트 등)
- `utils/`: 공통 유틸
- `assets/`: 이미지, 아이콘 등

## TypeScript Rules

- **Props 인터페이스**: 컴포넌트명 + `Props` 형식으로 작성한다.
  - Examples: `TripCardProps`, `RegionSelectorProps`
- **interface vs type 사용 기준**:
  - `interface`: 컴포넌트 Props, 외부 API 응답 객체 등 확장 가능성이 있는 객체 형태
  - `type`: 유니온 타입, 단순 타입 alias, 함수 시그니처
  - Examples:
    ```ts
    interface TripCardProps { ... }       // 컴포넌트 Props
    interface TourApiResponse { ... }     // API 응답 객체
    type TripDuration = 'day' | '1night' | '2night';  // 유니온 타입
    type FetchTrip = (id: string) => Promise<Trip>;   // 함수 시그니처
    ```

## Style and Layout

- Platform 별 스타일: `Platform.select` 또는 `Platform.OS`로 분리
- **styled-components 네이밍 규칙**: 요소의 역할을 명확히 드러내는 의미 기반 이름을 사용한다.

  | 유형                  | 네이밍 예시                              |
  | --------------------- | ---------------------------------------- |
  | 레이아웃 감싸는 요소  | `Container`, `Wrapper`, `Section`        |
  | 사용자 입력 요소      | `SearchInput`, `DateInput`, `TextArea`   |
  | 버튼                  | `SubmitButton`, `CancelButton`           |
  | 텍스트                | `Title`, `Description`, `Label`          |
  | 카드 / 리스트 아이템  | `TripCard`, `ContentItem`                |
