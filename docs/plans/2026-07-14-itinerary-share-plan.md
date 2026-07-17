# 일정 공유 기능 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Context:** MVP 핵심 기능(mvp-scope.md) "일정 공유 - 저장된 일정을 링크 또는 공유 기능으로 외부 공유 가능"을 구현한다. 이 리포지토리에는 백엔드가 없어(이전 조사에서 반복 확인됨) 실제 단축 링크/딥링크를 생성할 서버가 없다. MVP 조건은 "링크 **또는** 공유 기능"이라 OR 조건이므로, 이번 계획은 **React Native 내장 `Share` API로 일정 요약 텍스트를 OS 공유 시트(카카오톡, 메시지 등)로 공유**하는 것까지만 구현한다. 실제 단축 링크/웹에서 열람 가능한 공유 페이지는 백엔드가 생겨야 가능하므로 별도 이슈로 분리한다.

**Goal:** `ItineraryResultScreen`(feat/22까지 완성된 저장 기능 포함)에 "공유하기" 버튼을 추가해서, 현재 일정(1일차/2일차 장소·시간)을 텍스트로 정리해 OS 공유 시트로 내보낸다.

**Architecture:**
- `react-native`의 `Share` 모듈은 코어 내장이라 새 의존성이 필요 없다.
- `services/shareItinerary.ts`: `buildShareText({ stops, contentById })`(순수 함수, 테스트 대상)와 `shareItinerary(message)`(`Share.share` 얇은 래퍼, RN API라 테스트 대상 아님)로 분리한다. 나중에 실제 링크 공유로 바꿀 때 이 파일만 손대면 되도록 화면은 이 두 함수만 사용한다.
- 텍스트 포맷: 일자별로 그룹핑해서 "N일차" 제목 아래 "HH:MM-HH:MM 장소명"을 줄바꿈으로 나열한다 (별도 마크업 없이 순수 텍스트 — 카카오톡 등 공유 대상 앱이 대부분 plain text만 받음).
- 공유 취소(사용자가 공유 시트에서 뒤로가기)는 실패가 아니라 정상 흐름이므로 별도 에러 처리를 하지 않는다. 진짜 예외(드묾)만 최소한의 try/catch로 무시한다 — 억지로 실패 UI를 만들지 않는다.

**Tech Stack:** React Native 0.81.5 (내장 `Share` API), Expo ~54, styled-components ^6.4.1, TypeScript ~5.9.2 — 신규 의존성 없음

## Global Constraints

- 패키지 매니저: Bun (신규 의존성 없으므로 설치 단계 없음)
- 스타일: styled-components + COLORS 상수, transient prop `$` 접두사
- 모든 컴포넌트/함수는 named export
- **이 계획은 `feat/22`가 아닌 새 브랜치(이슈 생성 후 `feat/<이슈번호>`)에서, `feat/22`의 현재 워크트리 상태를 이어받아 실행한다**
- 실제 링크 공유(백엔드 필요), 공유 통계/추적은 범위 밖 (별도 이슈)

---

## 생성/수정 파일

| 파일 | 작업 |
|------|------|
| `services/shareItinerary.ts` | 신규 — `buildShareText`, `shareItinerary` |
| `screens/ItineraryResultScreen.tsx` | 수정 — "공유하기" 버튼 추가 |

---

## Task 1: 공유 서비스 (`services/shareItinerary.ts`)

```ts
import { Share } from 'react-native';
import type { Content } from '../types/content';
import type { ItineraryStop } from '../types/itinerary';

interface BuildShareTextInput {
  stops: ItineraryStop[];
  contentById: Record<string, Content>;
}

export function buildShareText({ stops, contentById }: BuildShareTextInput): string {
  const days = [1, 2];
  return days
    .map((day) => {
      const lines = stops
        .filter((stop) => stop.day === day)
        .map((stop) => `${stop.startTime}-${stop.endTime} ${contentById[stop.contentId]?.name ?? ''}`);
      return [`${day}일차`, ...lines].join('\n');
    })
    .join('\n\n');
}

export async function shareItinerary(message: string): Promise<void> {
  try {
    await Share.share({ message });
  } catch {
    // 공유 시트 취소/드문 네이티브 오류 — 사용자에게 별도 알릴 필요 없음
  }
}
```

- [ ] **Step 1: 파일 생성**
- [ ] **Step 2: 타입 검사** — `bunx tsc --noEmit`
- [ ] **Step 3: 유닛 테스트** (`services/shareItinerary.test.ts`) — `buildShareText`만 테스트 (순수 함수, `Share.share`는 RN 네이티브라 테스트 제외)
  - "일자별로 장소가 시간 순서대로 정리된 텍스트를 만든다"
  - "1일차/2일차 사이에 빈 줄로 구분된다"
  - `bun run test:run`으로 통과 확인

---

## Task 2: ItineraryResultScreen — 공유 버튼

- [ ] **Step 1: import 및 버튼 추가**

```tsx
import { buildShareText, shareItinerary } from '../services/shareItinerary';

// SaveButton 옆 또는 아래에 배치
<ShareButton
  onPress={() => shareItinerary(buildShareText({ stops, contentById }))}
  activeOpacity={0.8}
>
  <ShareButtonLabel>공유하기</ShareButtonLabel>
</ShareButton>
```

`ShareButton`/`ShareButtonLabel`은 `SaveButton`과 동일한 컨벤션이되, 배경은 `COLORS.white` + `border-color: COLORS.gray200`(보조 버튼 느낌으로 저장 버튼과 구분).

- [ ] **Step 2: 타입 검사** — `bunx tsc --noEmit`

---

## 검증 체크리스트

- [ ] `bun run start -- --offline --clear`로 앱 실행, 일정 화면까지 도달
- [ ] "공유하기" 탭 시 OS 공유 시트(카카오톡/메시지 등 목록)가 뜨는지 확인
- [ ] 실제 공유 대상(예: 나에게 보내기)으로 보내서 텍스트에 1일차/2일차 장소·시간이 올바르게 담겼는지 확인
- [ ] 공유 시트에서 취소해도 앱이 에러 없이 그대로 유지되는지 확인
- [ ] `bunx tsc --noEmit` 에러 없음
- [ ] `bun run test:run` 신규 테스트 포함 전체 통과

## 이번 범위에서 제외한 것 (별도 이슈)

- 실제 단축 링크 생성 및 웹에서 열람 가능한 공유 페이지 (백엔드 필요)
- 공유 클릭/조회 통계
