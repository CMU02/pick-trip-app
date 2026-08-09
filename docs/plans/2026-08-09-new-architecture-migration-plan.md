# New Architecture 전환 구현 계획 (#30)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `app.json`의 `newArchEnabled`를 `true`로 바꾸고, 앱 전 화면이 New Architecture에서 정상 동작함을 확인한다.

**Architecture:** 코드 변경은 `app.json` 한 줄뿐이다. `android/`가 `.gitignore` 대상인 CNG 프로젝트라 `expo prebuild --clean`이 네이티브 설정을 재생성한다. **이 작업의 실제 내용은 코드가 아니라 검증이다** — 정적 검사는 이미 통과 상태이므로 런타임 회귀를 실기에서 확인하는 것이 전부다.

**Tech Stack:** Expo SDK 54.0.35, React Native 0.81.5, TypeScript ~5.9.2, Bun, Biome 2.5.0

## Global Constraints

- 패키지 매니저는 **Bun**만 쓴다. `npm` / `yarn` 명령을 쓰지 않는다.
- 커밋 제목은 한국어. 형식은 `<type>(선택: 범위): <제목>`, 끝에 마침표 없음. `commit-msg` 훅이 강제한다.
- husky 훅을 `--no-verify`로 우회하지 않는다.
- 작업은 워크트리에서 하고, 정식 브랜치에는 `git merge --ff-only`로 로컬 병합한다. (`.claude/skills/git-convention/SKILL.md`)
- **푸시와 PR 생성은 하지 않는다.** 로컬 머지까지가 이 계획의 범위다.
- 설계 명세: `docs/plans/2026-08-08-bottom-tab-bar-redesign-design.md`

## 사전 확인된 사실

계획 작성 시점에 확인한 내용이다. 실행 시 다시 확인할 필요는 없다.

| 항목 | 확인 결과 |
|---|---|
| `newArchEnabled: false`의 유래 | 초기 커밋(`765fc6e`) 이후 미변경. 문제를 겪고 끈 것이 아니라 스캐폴드 기본값 |
| `expo-doctor` | 18개 중 17개 통과. 실패한 하나는 `expo` patch 버전(54.0.35 vs ~54.0.36)이며 New Arch와 무관 |
| RN Directory 호환성 검사 | 통과 |
| `masked-view` 0.3.2 | `codegenConfig` 없음. 단 Expo 문서가 권장하는 대체재이며 앱 코드에서 직접 import하지 않는 전이 의존성. 인터롭 레이어로 동작 |
| `android/` | `.gitignore:42` 등록. 커밋 대상은 `app.json`뿐 |
| `react-native-reanimated` 4.1.7 | **전이 의존성이 아니다.** `bun.lock`에 0건, 오토링킹 대상에도 없다. `gesture-handler`·`screens`는 `devDependencies`로만 참조한다. `node_modules/`에 남은 잔재이므로 워크트리에서 `bun install`하면 아예 없다 |

> **설계 명세 정정 필요:** `docs/plans/2026-08-08-...-design.md`의 #32 섹션은 "`react-native-reanimated`를 직접 의존성으로 **추가**한다 (현재는 전이 의존성)"이라고 적고 있다. 전이 의존성이라는 서술이 틀렸다. 실제로는 신규 의존성 추가다. 명세는 이미 `main`에 머지됐으므로 별도 `docs` 커밋으로 고친다.

## OTA 업데이트 경계 — 이번 작업에서는 무시 (결정 완료)

**결정:** 아직 배포한 적이 없어 실사용자가 없다. `app.json`의 `version`을 건드리지 않고 진행한다.

아래는 **첫 프로덕션 배포 전에 반드시 정리해야 할 사항**이므로 기록만 남긴다. 지금은 차단 요소가 아니다.

`app.json`의 `runtimeVersion`은 `{ "policy": "appVersion" }`이고 `version`은 `1.0.0`이다. `eas.json`의 `appVersionSource: "remote"` + `production.autoIncrement: true`가 올리는 것은 **Android `versionCode`이지 `app.json`의 `version`이 아니다.** 즉 아키텍처를 바꿔도 `runtimeVersion`은 `1.0.0`에 그대로 머문다.

그런데 `.eas/workflows/deploy.yml`은 `main` 푸시마다 `production` 브랜치로 OTA를 발행한다.

```yaml
on:
  push:
    branches: ['main']
jobs:
  publish_update:
    type: update
    params:
      branch: production
```

**결과적으로 구 아키텍처 빌드를 설치한 기존 사용자와 신 아키텍처 빌드가 같은 `runtimeVersion: 1.0.0` 버킷을 공유한다.**

#30 자체는 JS를 바꾸지 않으므로 당장은 무해하다. 위험한 것은 다음 순서다.

1. #30 머지 → 이후 네이티브 빌드는 New Architecture
2. 기존 사용자는 여전히 구 아키텍처 빌드를 들고 있음 (`runtimeVersion 1.0.0`)
3. #32 머지 → Reanimated 4(New Architecture 전용)를 import하는 JS 번들이 **같은 1.0.0 버킷으로** 발행됨
4. 구 아키텍처 클라이언트가 그 번들을 받아 크래시

`runtimeVersion`을 아키텍처 경계에서 갈라줘야 한다. 방법은 `app.json`의 `version`을 올리는 것이다(예: `1.0.0` → `1.1.0`). 그러면 구 아키텍처 클라이언트는 `1.0.0` 버킷에 남아 New Architecture용 업데이트를 받지 않는다.

**첫 배포 전 할 일:** `app.json`의 `version`(`1.0.0`)과 태그(`v0.0.1`)가 이미 어긋나 있다. 첫 프로덕션 릴리스 전에 둘을 맞추고, 이후 네이티브 변경마다 `version`을 올리는 절차를 세워야 한다. 별도 이슈로 다룬다.

---

## 변경 파일

| 파일 | 작업 |
|---|---|
| `app.json` | 수정 — `newArchEnabled` 1줄 |

`android/`는 `expo prebuild --clean`이 재생성하지만 gitignore 대상이라 커밋되지 않는다.

> **대안 기록:** Expo 문서는 SDK 53/54에서 New Architecture가 기본값이므로 `newArchEnabled` 키를 **삭제**하라고 권한다. SDK 55부터는 이 키가 무시되므로 삭제가 최종적으로는 맞다. 이 계획은 설계 명세에서 이미 승인된 `true` 설정을 따르고, 키 삭제는 SDK 55 업그레이드 시 함께 처리한다.

---

## Task 1: 워크트리 생성 및 레거시 기준선 확보

New Architecture 전환 **전에** 현재 상태의 동작을 확인해 둔다. 기준선이 없으면 Task 4에서 발견한 문제가 New Architecture 때문인지 원래 있던 것인지 구분할 수 없다.

**Files:**
- 변경 없음 (환경 준비 및 관찰만)

**Interfaces:**
- Produces: 레거시 아키텍처 기준선 기록. Task 4가 이것과 비교한다.

- [x] **Step 1: main 최신화**

```bash
git switch main
git pull
```

- [x] **Step 2: 작업 브랜치와 워크트리 생성**

`chore/new-architecture`는 PR #35로 이미 머지된 이름이므로 재사용하지 않는다.

```bash
git branch chore/enable-new-architecture
git worktree add ../pick-trip-enable-new-arch -b chore/enable-new-architecture-work chore/enable-new-architecture
```

- [x] **Step 3: 워크트리 환경 준비**

워크트리는 추적되지 않는 파일을 가져오지 않는다. 세 가지가 모두 필요하다.

```bash
cd ../pick-trip-enable-new-arch
bun install
cp ../pick-trip-app/.env .env
```

`.env`가 없으면 `EXPO_PUBLIC_API_BASE_URL`이 기본값 `https://api.pick-trip.app`으로 떨어져 동작은 하지만, 명시적으로 복사해 메인 작업복사본과 동일 조건을 만든다.

- [x] **Step 4: 정적 검사 기준선**

```bash
bunx tsc --noEmit
bun run test:run
```

기대: 둘 다 통과. 실패하면 New Architecture와 무관한 기존 문제이므로 **여기서 멈추고 보고한다.**

- [x] **Step 5: 레거시 아키텍처로 빌드 및 실행**

```bash
bun expo prebuild --clean
bun expo run:android
```

기대: 빌드 성공. 실행 시 콘솔에 아래 경고가 뜬다. 이것이 레거시 아키텍처로 돌고 있다는 증거다.

```
WARN  The app is running using the Legacy Architecture.
```

- [x] **Step 6: 기준선 기록**

아래 항목을 눌러보고 **현재 상태의 결과**를 기록한다. 통과/실패 여부가 아니라 "지금 이렇게 동작한다"를 적는 것이 목적이다.

**항목 번호는 Task 4 Step 2와 1:1로 대응한다.** 한쪽에만 있는 항목이 생기면 그 항목은 대조가 불가능해져 계획의 핵심 논리("레거시에도 있던 문제는 회귀가 아니다")가 무너진다.

| # | 화면 | 확인 내용 | 레거시 결과 |
|---|---|---|---|
| 1 | Auth | 앱 최초 진입, 게스트로 시작 | **정상.** 온보딩 없이 곧장 홈으로 진입 |
| 2 | Login | 카카오 로그인 완료 후 앱 복귀 | **정상.** 일정 화면으로 정확히 복귀하고 CTA가 `일정 저장`/`공유하기`로 전환됨 |
| 3 | Login | 구글 로그인 완료 후 앱 복귀 | **미검증** — 카카오로만 검증. 계정 자격 증명 필요 |
| 4 | Main / Home | 지역 선택, 날짜 피커 모달, 동행 선택 | **정상.** 단 지역 칩을 누른 직후 `로그인이 만료됐어요` Alert 발생 (아래 참조) |
| 5 | Main / Explore | 무한 스크롤, 카테고리 필터, 카드 담기, 상세 모달 | **정상.** 8회 스와이프로 추가 페이지 로드 확인. 이미지 없는 항목은 이모지 플레이스홀더로 대체 |
| 6 | Main / Basket | 담긴 목록 표시, 항목 삭제 | **정상.** 체크 뱃지를 눌러 삭제, CTA가 `일정 만들기` → `1개 더 담으면...`으로 비활성 전환 |
| 7 | Main / Profile | 취향 설정, 로그아웃 후 화면 리셋 | **정상.** 취향 토글 즉시 반영. 로그아웃 시 홈으로 리셋되고 게스트 배너 복귀. 바구니(2곳)는 로컬 저장이라 유지됨 |
| 8 | 탭바 | 4개 탭 왕복 전환. 탐색에서 2개 담고 뱃지가 2로, 바구니에서 1개 지우고 1로 바뀌는지 | **정상.** 뱃지 0→1→2→1 정확. 탭 왕복 후 탐색 리스트 스크롤 위치도 유지됨 |
| 9 | Priority | 우선순위 칩 3단계 단일 선택 | **정상.** 하단 집계도 `꼭 가기 1 · 가면 좋음 1 · 시간 남으면 0`으로 즉시 반영 |
| 10 | Itinerary | 일정 생성, 결과 표시, 저장 | **정상.** 1박 2일이 1일차/2일차로 분배됨. 로그인 후 저장하면 CTA가 `저장 완료`로 전환. 우선순위 반영에 불일치 있음 (B) |
| 11 | Resume | 저장된 일정 이어하기 | **정상.** 재시작 시 `저장된 일정이 있어요 / 8월 9일에 저장함` → `이어보기`로 2곳 복원. 단 (D)(E) 참조 |
| 12 | Shared | 공유 시트 열림. 딥링크는 **콜드스타트**(앱 완전 종료 후 링크 진입)와 **웜스타트**(백그라운드 상태에서 링크 진입)를 따로 기록 | **공유 링크 생성은 실패** (C). 딥링크 라우팅 자체는 웜·콜드 모두 정상 — 없는 토큰으로 진입하면 `공유된 일정을 찾을 수 없어요`가 정확히 뜬다. 단 `닫기` 버튼 레이아웃이 깨짐 (F) |
| 13 | 세션 만료 | SecureStore의 토큰을 무효값으로 바꾼 뒤 탐색 목록을 새로고침 → Alert → Auth 화면으로 리셋되는지, 뒤로가기로 이전 화면에 못 돌아가는지 | **Alert 경로는 (A)에서 실제로 재현됨** — `onSessionExpired` → Alert → `navigationRef.reset('Auth')` → `AuthGate`가 곧장 `Main`으로 되돌림. 즉 **사용자 눈에는 리셋이 보이지 않는다.** 토큰 무효화를 통한 명시적 재현은 임시 코드 패치가 필요해 미실시 |

8번과 13번은 초안에 없던 항목이다. 13번은 `App.tsx:27` `SessionExpiryHandler`의 `navigationRef.reset` 경로로, New Architecture와 무관하게 원래 취약한 지점이라 기준선이 특히 중요하다.

콘솔에 뜨는 경고·에러도 함께 적는다. Task 4에서 "New Architecture 때문에 생긴 것"만 골라내는 데 쓴다.

**콘솔 기준선: `The app is running using the Legacy Architecture.` 경고 1건이 전부다.** 다른 경고·에러는 없다. Task 4에서 이 경고가 사라지고 대신 새 경고가 뜬다면 전부 New Architecture 유래로 봐야 한다.

### 레거시에서 이미 존재하는 문제 (회귀 아님)

Task 4에서 똑같이 나타나더라도 New Architecture 탓이 아니다.

**(A) 게스트 상태에서 지역 칩을 누르면 `로그인이 만료됐어요` Alert가 뜬다.**

토큰이 없는 게스트가 취향 저장 API를 호출 → 401 → `apiClient.ts:33` `refreshAccessToken`이 리프레시 토큰 없음으로 `false` 반환 → `apiClient.ts:79` `onSessionExpired` 발화. 애초에 로그인한 적이 없는데 "만료됐다"고 알리는 것이라 문구도 상황도 틀렸다. **OK를 누르면 홈에 그대로 머문다** — Auth로 리셋되지는 않는다(저장된 일정이 없어 `AuthGate`가 곧장 `Main`으로 되돌리기 때문). 별도 이슈로 다뤄야 한다.

**(B) 우선순위 변경이 일정 결과 안내문에 반영되지 않는다.**

`가탄마을`을 `가면 좋음`에서 `꼭 가기`로 바꾸고 일정을 생성했는데, 결과 카드의 안내가 여전히 `가면 좋음로 표시하셔서 1일차에 배치했습니다`로 나왔다. `RootNavigator.tsx:94` `onContinue`가 `updateItemPriority`를 서버에 보내는데 게스트라 실패했을 가능성이 높다. (A)와 같은 뿌리일 수 있다. 이것도 별도 이슈다.

**(C) 공유 링크 생성이 실패한다.**

카카오 로그인 후 저장까지 마친 일정에서 `공유하기`를 눌렀는데 `공유 링크 생성 실패 / 잠시 후 다시 시도해주세요.` Alert가 떴다. Metro 콘솔에는 아무 것도 찍히지 않았다 — 에러가 잡혀 Alert로만 변환된다. 서버 측 문제일 가능성이 높다. **New Architecture와 무관하며, Task 4에서 같은 증상이 나와도 회귀가 아니다.**

**(D) 앱 재시작 후 로그인 상태가 유지되지 않는다.**

카카오 로그인 → 저장 → 재시작 → `이어보기`로 진입했더니 CTA가 다시 `로그인하고 일정 저장`이었다. 토큰은 SecureStore에 남아 있는데 `isGuest`가 재시작마다 `true`로 초기화되고 토큰으로부터 복원되지 않는다. 별도 이슈다.

**(E) 재시작 후 취향과 날짜가 복원되지 않는다.**

`아이와 함께` · `자연 위주` · `하동`을 골라뒀는데 재시작 후 내 정보 화면에서 전부 해제 상태였다. 이어보기로 복원한 일정에도 `8.9 - 8.10` 날짜가 사라지고 `하동 · 총 2곳`만 남았다. 바구니 개수(2곳)는 유지된다. 저장 범위에 취향·날짜가 빠져 있는 것으로 보인다.

**(F) 공유 화면 `닫기` 버튼 레이아웃이 깨진다.**

버튼 폭이 텍스트를 감싸지 못해 `닫기` 두 글자가 세로로 눌려 보인다. 순수 스타일 문제다.

### 개발 빌드 한계로 검증 불가한 항목

**딥링크 콜드스타트를 릴리스 빌드와 동일하게 재현할 수 없다.** 앱을 완전히 종료한 뒤 `picktrip://share/...` 인텐트를 보내면 expo-dev-client 런처가 먼저 뜬다. 런처에서 개발 서버를 고르면 그제서야 앱이 뜨면서 Shared 화면으로 라우팅된다 — 초기 URL 자체는 보존되므로 라우팅 로직은 동작한다고 볼 수 있지만, 릴리스 빌드의 진짜 콜드스타트 경로는 아니다. 이 항목은 Task 4에서도 같은 조건으로만 비교한다.

- [x] **Step 7: 커밋 없음**

이 태스크는 관찰만 한다. 커밋할 변경이 없다.

---

## Task 2: New Architecture 활성화 및 빌드

**Files:**
- Modify: `app.json:10`

**Interfaces:**
- Consumes: Task 1의 워크트리 환경
- Produces: New Architecture로 빌드된 Android 앱. Task 3, 4가 이 위에서 검증한다.

- [ ] **Step 1: `app.json` 수정**

```diff
   "userInterfaceStyle": "light",
-  "newArchEnabled": false,
+  "newArchEnabled": true,
   "splash": {
```

- [ ] **Step 2: 네이티브 프로젝트 재생성**

```bash
bun expo prebuild --clean
```

- [ ] **Step 3: 반영 확인**

```bash
grep newArchEnabled android/gradle.properties
```

기대: `newArchEnabled=true`

`false`가 나오면 prebuild가 `app.json`을 반영하지 못한 것이다. `android/`를 지우고 다시 실행한다.

- [ ] **Step 4: 기존 앱 제거 후 빌드**

**증분 설치를 하면 안 된다.** 구 아키텍처로 빌드된 기존 dev client APK 위에 덮어쓰면 네이티브 라이브러리가 섞여 진단이 불가능해진다.

```bash
adb uninstall com.hyeonjun1968.picktrip
bun expo run:android
```

빌드가 실패하면 로그에서 어떤 라이브러리가 원인인지 찾는다. 설계 명세의 사전 검증에서 모든 네이티브 모듈이 호환으로 확인됐으므로, 실패한다면 codegen 캐시 문제일 가능성이 높다.

```bash
cd android && ./gradlew clean && cd ..
bun expo run:android
```

- [ ] **Step 5: 런타임에서 Fabric 확인 — 이 계획에서 가장 중요한 단계**

**여기가 통과하지 않으면 Task 3·4의 모든 검증이 무의미하다.** 구 아키텍처를 테스트하면서 "전환했는데 아무 문제 없다"는 잘못된 결론을 내리게 된다.

에뮬레이터에서 `Ctrl+M` → Open JS Debugger → 콘솔에서 아래를 평가한다.

```js
global.nativeFabricUIManager != null   // true 여야 한다
global.RN$Bridgeless                   // truthy 여야 한다
```

둘 중 하나라도 falsy면 아직 Paper(구 아키텍처)로 돌고 있는 것이다. **여기서 멈추고 Step 2로 돌아간다.**

Metro 콘솔의 아래 경고 소멸도 함께 확인하되, 이것만으로 판단하지 않는다. 경고 부재는 간접 증거이고 위 전역 객체가 직접 증거다.

```
WARN  The app is running using the Legacy Architecture.
```

> **왜 이 단계를 넣었나:** `expo run:android`는 `android/` 디렉터리가 이미 있으면 prebuild를 통째로 건너뛴다. Step 2의 `--clean`이 정상 동작했다면 문제없지만, 실패했을 때 조용히 구 아키텍처로 빌드된다. 게다가 `android/`는 gitignore 대상이라 EAS 클라우드 빌드는 매번 새로 prebuild한다 — **로컬은 구 아키텍처, CI는 신 아키텍처로 갈라져 문제가 EAS 빌드에서만 터지는** 최악의 분기가 가능하다.

- [ ] **Step 6: 정적 검사**

```bash
bunx tsc --noEmit
bun run test:run
```

기대: 둘 다 통과. `app.json` 변경은 타입·테스트에 영향이 없으므로 Task 1 Step 4와 같은 결과여야 한다.

- [ ] **Step 7: 커밋**

```bash
git add app.json
git commit -m "chore: New Architecture 활성화

SDK 54가 New Architecture를 끌 수 있는 마지막 버전이고,
SDK 55부터는 강제 활성화된다. 초기 커밋 이후 손대지 않은
스캐폴드 기본값이 남아 있던 것을 정리한다.

하단 탭바 리디자인(#32)에서 쓸 Reanimated 4가
New Architecture 전용이라 선행 조건이기도 하다.

Refs #30"
```

---

## Task 3: Reanimated 동작 스모크 검증

#30의 존재 이유가 "#32에서 Reanimated 4를 쓰기 위해서"다. 여기서 실제로 되는지 확인하지 않으면, #32 착수 시점에 전제가 무너져 이 회귀 검증 사이클을 다시 돌아야 한다.

검증용 코드는 **커밋하지 않고 되돌린다.** Reanimated의 정식 도입은 #32의 범위다.

**Files:**
- 임시 수정 후 되돌림: `App.tsx`

**Interfaces:**
- Consumes: Task 2의 New Architecture 빌드
- Produces: Reanimated 4가 이 환경에서 초기화되고 UI 스레드 애니메이션이 도는지에 대한 판정

- [x] **Step 1: Reanimated를 임시 설치**

`node_modules/`에 4.1.7이 보이지만 **전이 의존성이 아니라 잔재다.** `bun.lock`에 없고 오토링킹 대상에도 없어서 실제로는 링크되지 않는다. 워크트리에서 `bun install`했다면 아예 없다.

```bash
bunx expo install react-native-reanimated react-native-worklets
```

설치 후 실제로 링크됐는지 확인한다.

```bash
bun expo prebuild --clean
node -e "const j=require('./android/build/generated/autolinking/autolinking.json'); console.log(Object.keys(j.dependencies||{}).join('\n'))"
```

기대: 목록에 `react-native-reanimated`와 `react-native-worklets`가 나타난다. 없으면 Step 2로 가봐야 소용없다.

> **주의:** `autolinking.json`은 `prebuild`가 아니라 **Gradle 실행 시점에** 생성된다. `prebuild` 직후에 읽으면 `MODULE_NOT_FOUND`가 난다. 빌드를 한 번 돌린 뒤에 확인해야 한다.

**결과:** 설치된 버전은 `react-native-reanimated@4.1.7`, `react-native-worklets@0.5.1`이다. 빌드 후 오토링킹 목록이 6개에서 8개로 늘었다.

```
@react-native-async-storage/async-storage
@react-native-masked-view/masked-view
expo
react-native-gesture-handler
react-native-reanimated      ← 추가됨
react-native-safe-area-context
react-native-screens
react-native-worklets        ← 추가됨
```

**이것이 `node_modules/`의 4.1.7이 잔재였다는 결정적 증거다.** 설치 전 오토링킹 목록에는 둘 다 없었다.

`babel.config.js`가 없어도 동작한다. `babel-preset-expo`가 Reanimated 설치를 감지해 worklets 플러그인을 자동으로 넣는다.

- [x] **Step 2: `App.tsx`에 임시 검증 컴포넌트 추가**

`App.tsx`의 최상단 import에 아래 한 줄을 넣는다.

```tsx
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
```

`useEffect`는 `App.tsx:4`에서 이미 import하고 있으므로 추가하지 않는다.

그리고 `App` 컴포넌트가 반환하는 트리의 가장 바깥에 아래 컴포넌트를 하나 렌더링한다.

```tsx
function ReanimatedSmokeTest() {
  const width = useSharedValue(60);

  const style = useAnimatedStyle(() => ({
    width: withTiming(width.value, { duration: 600 }),
    height: 8,
    backgroundColor: '#F59E0B',
  }));

  useEffect(() => {
    const id = setInterval(() => {
      width.value = width.value === 60 ? 200 : 60;
    }, 800);
    return () => clearInterval(id);
  }, [width]);

  return <Animated.View style={style} />;
}
```

`width`를 애니메이션하는 것이 핵심이다. **레이아웃 값**이라 RN 내장 `Animated`로는 네이티브 드라이버에 못 올리는 바로 그 케이스이고, #32의 탭바 캡슐 확장과 동일한 성격이다.

- [x] **Step 3: 실행 및 확인**

```bash
bun expo run:android
```

확인할 것 세 가지.

1. 앱이 크래시 없이 뜬다
2. 주황색 막대가 60↔200px 사이를 부드럽게 오간다
3. 콘솔에 `[Reanimated] Native part of Reanimated doesn't seem to be initialized` 류의 경고가 없다

**막대가 아예 안 움직이거나 크래시가 나면 #30의 전제가 무너진 것이다.** 여기서 멈추고 보고한다. #32의 애니메이션 방식을 다시 정해야 한다.

**결과: 세 가지 모두 통과.**

연속 스크린샷으로 막대 폭을 측정했다. 200dp는 이 기기(1080px, density 2.625)에서 약 525px이고 60dp는 약 158px이다.

| 프레임 | 막대 끝 x좌표 | 상태 |
|---|---|---|
| f1 | 약 525px | 확장 (200dp) |
| f6 | 약 160px | 축소 (60dp) |

**레이아웃 값인 `width`가 실제로 애니메이션된다.** Metro 콘솔에 Reanimated·worklets 관련 경고는 한 건도 없다.

> **빌드 중 만난 문제:** 첫 시도가 `Unable to delete file ... expo-modules-core/.../classes.jar`로 실패했다. Windows 파일 잠금이며 Reanimated와 무관하다. `android/gradlew.bat --stop`으로 데몬을 종료하고 해당 `intermediates` 디렉터리를 지운 뒤 재시도해 성공했다(3m 10s). #32 작업 중에도 재현될 수 있으니 기록해둔다.

- [x] **Step 4: 검증 코드 되돌리기**

```bash
git checkout -- App.tsx
git checkout -- package.json bun.lock
bun install
```

`git status`가 깨끗한지 확인한다. `app.json`만 Task 2에서 이미 커밋된 상태여야 한다.

**결과: `git status` 깨끗.** 다만 `node_modules/react-native-reanimated`는 남는다. `bun install`이 lockfile에서 빠진 패키지를 지우지 않기 때문이다. **처음에 우리를 헷갈리게 했던 그 잔재가 다시 생긴 것이므로**, 이후 이 디렉터리의 존재를 의존성 근거로 삼으면 안 된다. 판단 기준은 항상 `bun.lock`과 오토링킹 목록이다.

- [x] **Step 5: 커밋 없음**

되돌렸으므로 커밋할 변경이 없다. 판정 결과만 기록한다.

**판정: #32 착수 가능.** Reanimated 4가 New Architecture에서 초기화되고, 레이아웃 값 애니메이션이 동작한다. 설계 명세의 탭바 캡슐 확장 방식을 그대로 진행해도 된다.

---

## Task 4: 전 화면 런타임 회귀 검증

이 태스크가 #30의 실제 비용이다. Expo 문서도 *"For most non-trivial apps, you're likely to encounter some issues"* 라고 명시한다.

**Files:**
- 변경 없음 (문제 발견 시 별도 판단)

**Interfaces:**
- Consumes: Task 2의 New Architecture 빌드, Task 1 Step 6의 레거시 기준선
- Produces: 화면별 통과/실패 판정

> **실행 순서 변경:** Task 3(Reanimated 스모크)보다 **Task 4를 먼저** 돌렸다. Task 3은 Reanimated를 설치해 `prebuild --clean` + 재빌드를 하고 다시 되돌리므로, 순서를 바꾸면 전체 빌드 한 번을 아낀다. Task 2의 깨끗한 New Architecture 빌드를 그대로 회귀 검증에 쓸 수 있다는 점에서도 더 정확하다.

- [x] **Step 1: 앱 재실행**

Task 2의 빌드를 그대로 쓴다. `adb uninstall` 후 재설치했으므로 앱 데이터도 초기화되어 Task 1과 같은 게스트 상태에서 시작한다.

- [x] **Step 2: 화면별 회귀 확인**

Task 1 Step 6의 기준선과 **비교**한다. 레거시에서도 있던 문제는 회귀가 아니다.

| # | 화면 | 확인 내용 | 판정 |
|---|---|---|---|
| 1 | Auth | 앱 최초 진입, 게스트로 시작 | **동일** |
| 2 | Login | 카카오 로그인이 끝까지 완료되고 앱으로 복귀 | **동일.** 브라우저에서 돌아와 일정 화면으로 정확히 복귀, CTA 전환도 같다 |
| 3 | Login | 구글 로그인이 끝까지 완료되고 앱으로 복귀 | 기준선도 미검증이라 대조 불가 |
| 4 | Main / Home | 지역 선택 토글, 날짜 피커 모달, 동행 선택 | **동일.** 날짜 피커 모달 정상 — New Architecture에서 자주 깨지는 지점이라 특히 확인했다 |
| 5 | Main / Explore | 무한 스크롤, 카테고리 필터, 카드 담기, 상세 모달 | **동일.** 8회 스와이프 추가 로드, 필터 전환, 상세 모달 모두 기준선과 같다 |
| 6 | Main / Basket | 담긴 목록 표시, 항목 삭제, 바구니 뱃지 숫자 | **동일** |
| 7 | Main / Profile | 취향 설정 토글, 로그아웃 후 화면 리셋 | **동일.** 로그아웃 시 홈으로 리셋 + 게스트 배너 복귀, 바구니 2곳 유지까지 같다 |
| 8 | 탭바 | 4개 탭 전환, 뱃지 갱신 | **동일.** 0→2→1→2 정확. 탭 왕복 후 탐색 스크롤 위치 유지도 같다 |
| 9 | Priority | 우선순위 칩 3단계 단일 선택 | **동일** |
| 10 | Itinerary | 일정 생성, 결과 표시, 저장 | **동일.** 저장 후 CTA가 `저장 완료`로 전환되는 것까지 같다 |
| 11 | Resume | 저장된 일정 이어하기 | **동일.** `8월 9일에 저장함` → `이어보기`로 2곳 복원 |
| 12 | Shared | 공유 시트 열림. 딥링크 **콜드스타트**와 **웜스타트**를 따로 확인 | **동일.** 공유 링크 생성 실패 (C), 웜스타트 딥링크 라우팅 정상, 닫기 버튼 깨짐 (F) — 전부 기준선과 같다 |
| 13 | 세션 만료 | 토큰 무효화 후 API 호출 → Alert → Auth 화면 리셋, 뒤로가기로 복귀 불가 | 기준선과 같은 조건으로만 확인. 명시적 토큰 무효화는 양쪽 모두 미실시 |

**판정: 회귀 0건.** 레거시에서 관찰된 (A)~(F)가 New Architecture에서도 그대로 재현되고, 새로 생긴 문제는 없다. 특히 (B) 우선순위 불일치와 (C) 공유 실패가 양쪽에서 동일하게 나타난 것이 대조의 핵심 근거다.

- [x] **Step 3: 소셜 로그인 환경 주의**

2·3번 항목은 **운영 서버(`https://api.pick-trip.app`)로만 검증된다.**

- 로컬 `expo run:android`는 `.env`를 읽으므로 운영 서버를 가리킨다 → 검증 가능
- EAS `development` 프로파일은 `EXPO_PUBLIC_API_BASE_URL`을 `http://10.0.2.2:8080`으로 덮어쓴다 → 카카오 `KOE006`, 구글 `device_id and device_name are required` 발생. **이건 New Architecture 회귀가 아니다.**

EAS 빌드로 검증해야 한다면 `preview` 이상의 프로파일을 쓴다.

- [x] **Step 4: 콘솔 경고 대조**

Metro 콘솔의 경고·에러를 Task 1 Step 6 기록과 대조한다. **New Architecture 전환 후에만 새로 나타난 것**을 추린다.

특히 아래 유형을 찾는다.

- `Tried to register two views with the same name`
- `... is not a registered callable module`
- ViewManager 관련 인터롭 경고

**결과: 경고·에러 0건.** 위 세 유형 모두 나타나지 않았다. 레거시에 있던 `Legacy Architecture` 경고가 사라졌고 그 자리를 대신하는 것이 없다. 전체 세션 로그가 번들링 진행률과 `Bundled` 줄뿐이다.

빌드 단계에서는 `expo-modules-core`의 Kotlin deprecation 경고(`reportExceptionToLogBox`)가 나오지만 라이브러리 내부 코드이며 아키텍처와 무관하다.

- [x] **Step 5: 판정**

- 13개 항목 모두 기준선과 동일 → Task 5로 진행
- 회귀 발견 → **여기서 멈추고 보고한다.** 원인 라이브러리를 특정하고, 되돌릴지 우회할지는 별도 판단이다

되돌리려면 `app.json`을 `false`로 되돌리고 `bun expo prebuild --clean`을 다시 실행한다.

**판정: 통과.** 회귀 0건, 새 콘솔 경고 0건. Expo 문서가 경고한 *"you're likely to encounter some issues"* 에 해당하는 사례가 이 앱에서는 나오지 않았다. 앱이 쓰는 네이티브 모듈이 전부 New Architecture를 지원하는 최신 버전이고, ViewManager를 직접 구현한 코드가 없기 때문으로 보인다.

- [x] **Step 6: 커밋 없음**

검증만 하는 태스크다.

---

## Task 5: 워크트리 정리 및 로컬 병합

**Files:**
- 변경 없음 (브랜치 조작만)

**Interfaces:**
- Consumes: Task 2의 커밋, Task 4의 통과 판정
- Produces: `chore/enable-new-architecture` 브랜치에 병합된 커밋

- [ ] **Step 1: 워크트리 상태 확인**

```bash
cd ../pick-trip-enable-new-arch
git status
git log --oneline main..HEAD
```

기대: 작업 트리 깨끗함. 커밋은 Task 2의 것 하나뿐.

Task 3의 검증 코드가 남아 있으면 여기서 걸린다. `git checkout -- .`으로 정리한다.

- [ ] **Step 2: 정식 브랜치로 로컬 병합**

```bash
cd ../pick-trip-app
git switch chore/enable-new-architecture
git merge --ff-only chore/enable-new-architecture-work
```

기대: `Fast-forward`

fast-forward가 실패하면 `chore/enable-new-architecture`가 예상 밖으로 움직인 것이다. 머지 커밋으로 덮지 말고 원인을 확인한다.

- [ ] **Step 3: 워크트리 제거**

```bash
git worktree remove ../pick-trip-enable-new-arch
git branch -d chore/enable-new-architecture-work
```

- [ ] **Step 4: 결과 확인**

```bash
git log --oneline main..chore/enable-new-architecture
git diff --stat main chore/enable-new-architecture
```

기대: 커밋 1개, `app.json | 2 +-`

- [ ] **Step 5: 여기서 멈춘다**

**푸시와 PR 생성은 하지 않는다.** 기능·동작에 영향을 주는 변경이므로 작업자가 직접 확인한 뒤 진행한다.

작업자에게 아래를 보고한다.

- Task 2 Step 5 Fabric 확인 결과 (`global.nativeFabricUIManager`, `global.RN$Bridgeless`)
- Task 4 회귀 검증 결과 (13개 항목, 기준선 대조)
- Task 3 Reanimated 스모크 결과 — #32 착수 가능 여부
- Task 1 대비 새로 나타난 콘솔 경고

---

## 완료 조건

이슈 #30의 체크리스트와 대응한다.

- [ ] `app.json`의 `newArchEnabled`가 `true`
- [ ] `android/gradle.properties`의 `newArchEnabled`가 `true` (prebuild 반영 확인)
- [ ] 기존 APK 제거 후 재설치한 빌드에서 `global.nativeFabricUIManager != null` 이고 `global.RN$Bridgeless`가 truthy
- [ ] `bun expo prebuild --clean` 후 Android 빌드 성공
- [ ] Metro 콘솔에 Legacy Architecture 경고가 뜨지 않음
- [ ] 지역 선택 → 날짜 → 동행 → 콘텐츠 탐색 → 우선순위 → 일정 결과 흐름 정상
- [ ] 카카오 / 구글 로그인 정상 (운영 서버 기준)
- [ ] 일정 저장 · 이어하기 · 공유 정상
- [ ] `bunx tsc --noEmit` 통과
- [ ] `bun run test:run` 통과
- [ ] Reanimated 4가 New Architecture에서 레이아웃 값을 애니메이션함을 확인 (#32 전제)

## 범위 밖

- **iOS 검증** — 이 저장소에 `ios/` 디렉터리가 없고 Android만 빌드해왔다. iOS 지원을 시작할 때 별도로 다룬다.
- **`react-native-reanimated` 정식 도입** — #32의 범위다. Task 3은 검증 후 되돌린다.
- **`expo` patch 버전 갱신** (54.0.35 → 54.0.36) — `expo-doctor`가 지적하지만 New Architecture와 무관하다. 별도 `chore`로 다룬다.
- **`newArchEnabled` 키 삭제** — Expo 문서의 권장 방식이지만 SDK 55 업그레이드 시 함께 처리한다.
