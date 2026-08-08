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

- [ ] **Step 1: main 최신화**

```bash
git switch main
git pull
```

- [ ] **Step 2: 작업 브랜치와 워크트리 생성**

`chore/new-architecture`는 PR #35로 이미 머지된 이름이므로 재사용하지 않는다.

```bash
git branch chore/enable-new-architecture
git worktree add ../pick-trip-enable-new-arch -b chore/enable-new-architecture-work chore/enable-new-architecture
```

- [ ] **Step 3: 워크트리 환경 준비**

워크트리는 추적되지 않는 파일을 가져오지 않는다. 세 가지가 모두 필요하다.

```bash
cd ../pick-trip-enable-new-arch
bun install
cp ../pick-trip-app/.env .env
```

`.env`가 없으면 `EXPO_PUBLIC_API_BASE_URL`이 기본값 `https://api.pick-trip.app`으로 떨어져 동작은 하지만, 명시적으로 복사해 메인 작업복사본과 동일 조건을 만든다.

- [ ] **Step 4: 정적 검사 기준선**

```bash
bunx tsc --noEmit
bun run test:run
```

기대: 둘 다 통과. 실패하면 New Architecture와 무관한 기존 문제이므로 **여기서 멈추고 보고한다.**

- [ ] **Step 5: 레거시 아키텍처로 빌드 및 실행**

```bash
bun expo prebuild --clean
bun expo run:android
```

기대: 빌드 성공. 실행 시 콘솔에 아래 경고가 뜬다. 이것이 레거시 아키텍처로 돌고 있다는 증거다.

```
WARN  The app is running using the Legacy Architecture.
```

- [ ] **Step 6: 기준선 기록**

아래 항목을 눌러보고 **현재 상태의 결과**를 기록한다. 통과/실패 여부가 아니라 "지금 이렇게 동작한다"를 적는 것이 목적이다.

**항목 번호는 Task 4 Step 2와 1:1로 대응한다.** 한쪽에만 있는 항목이 생기면 그 항목은 대조가 불가능해져 계획의 핵심 논리("레거시에도 있던 문제는 회귀가 아니다")가 무너진다.

| # | 화면 | 확인 내용 | 레거시 결과 |
|---|---|---|---|
| 1 | Auth | 앱 최초 진입, 게스트로 시작 | |
| 2 | Login | 카카오 로그인 완료 후 앱 복귀 | |
| 3 | Login | 구글 로그인 완료 후 앱 복귀 | |
| 4 | Main / Home | 지역 선택, 날짜 피커 모달, 동행 선택 | |
| 5 | Main / Explore | 무한 스크롤, 카테고리 필터, 카드 담기, 상세 모달 | |
| 6 | Main / Basket | 담긴 목록 표시, 항목 삭제 | |
| 7 | Main / Profile | 취향 설정, 로그아웃 후 화면 리셋 | |
| 8 | 탭바 | 4개 탭 왕복 전환. 탐색에서 2개 담고 뱃지가 2로, 바구니에서 1개 지우고 1로 바뀌는지 | |
| 9 | Priority | 우선순위 칩 3단계 단일 선택 | |
| 10 | Itinerary | 일정 생성, 결과 표시, 저장 | |
| 11 | Resume | 저장된 일정 이어하기 | |
| 12 | Shared | 공유 시트 열림. 딥링크는 **콜드스타트**(앱 완전 종료 후 링크 진입)와 **웜스타트**(백그라운드 상태에서 링크 진입)를 따로 기록 | |
| 13 | 세션 만료 | SecureStore의 토큰을 무효값으로 바꾼 뒤 탐색 목록을 새로고침 → Alert → Auth 화면으로 리셋되는지, 뒤로가기로 이전 화면에 못 돌아가는지 | |

8번과 13번은 초안에 없던 항목이다. 13번은 `App.tsx:27` `SessionExpiryHandler`의 `navigationRef.reset` 경로로, New Architecture와 무관하게 원래 취약한 지점이라 기준선이 특히 중요하다.

콘솔에 뜨는 경고·에러도 함께 적는다. Task 4에서 "New Architecture 때문에 생긴 것"만 골라내는 데 쓴다.

- [ ] **Step 7: 커밋 없음**

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

- [ ] **Step 1: Reanimated를 임시 설치**

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

- [ ] **Step 2: `App.tsx`에 임시 검증 컴포넌트 추가**

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

- [ ] **Step 3: 실행 및 확인**

```bash
bun expo run:android
```

확인할 것 세 가지.

1. 앱이 크래시 없이 뜬다
2. 주황색 막대가 60↔200px 사이를 부드럽게 오간다
3. 콘솔에 `[Reanimated] Native part of Reanimated doesn't seem to be initialized` 류의 경고가 없다

**막대가 아예 안 움직이거나 크래시가 나면 #30의 전제가 무너진 것이다.** 여기서 멈추고 보고한다. #32의 애니메이션 방식을 다시 정해야 한다.

- [ ] **Step 4: 검증 코드 되돌리기**

```bash
git checkout -- App.tsx
git checkout -- package.json bun.lock
bun install
```

`git status`가 깨끗한지 확인한다. `app.json`만 Task 2에서 이미 커밋된 상태여야 한다.

- [ ] **Step 5: 커밋 없음**

되돌렸으므로 커밋할 변경이 없다. 판정 결과만 기록한다.

---

## Task 4: 전 화면 런타임 회귀 검증

이 태스크가 #30의 실제 비용이다. Expo 문서도 *"For most non-trivial apps, you're likely to encounter some issues"* 라고 명시한다.

**Files:**
- 변경 없음 (문제 발견 시 별도 판단)

**Interfaces:**
- Consumes: Task 2의 New Architecture 빌드, Task 1 Step 6의 레거시 기준선
- Produces: 화면별 통과/실패 판정

- [ ] **Step 1: 앱 재실행**

Task 3에서 코드를 되돌렸으므로 다시 빌드한다.

```bash
bun expo run:android
```

- [ ] **Step 2: 화면별 회귀 확인**

Task 1 Step 6의 기준선과 **비교**한다. 레거시에서도 있던 문제는 회귀가 아니다.

| # | 화면 | 확인 내용 | 판정 |
|---|---|---|---|
| 1 | Auth | 앱 최초 진입, 게스트로 시작 | |
| 2 | Login | 카카오 로그인이 끝까지 완료되고 앱으로 복귀 | |
| 3 | Login | 구글 로그인이 끝까지 완료되고 앱으로 복귀 | |
| 4 | Main / Home | 지역 선택 토글, 날짜 피커 모달, 동행 선택 | |
| 5 | Main / Explore | 무한 스크롤, 카테고리 필터, 카드 담기, 상세 모달 | |
| 6 | Main / Basket | 담긴 목록 표시, 항목 삭제, 바구니 뱃지 숫자 | |
| 7 | Main / Profile | 취향 설정 토글, 로그아웃 후 화면 리셋 | |
| 8 | 탭바 | 4개 탭 전환, 뱃지 갱신 | |
| 9 | Priority | 우선순위 칩 3단계 단일 선택 | |
| 10 | Itinerary | 일정 생성, 결과 표시, 저장 | |
| 11 | Resume | 저장된 일정 이어하기 | |
| 12 | Shared | 공유 시트 열림. 딥링크 **콜드스타트**와 **웜스타트**를 따로 확인 | |
| 13 | 세션 만료 | 토큰 무효화 후 API 호출 → Alert → Auth 화면 리셋, 뒤로가기로 복귀 불가 | |

- [ ] **Step 3: 소셜 로그인 환경 주의**

2·3번 항목은 **운영 서버(`https://api.pick-trip.app`)로만 검증된다.**

- 로컬 `expo run:android`는 `.env`를 읽으므로 운영 서버를 가리킨다 → 검증 가능
- EAS `development` 프로파일은 `EXPO_PUBLIC_API_BASE_URL`을 `http://10.0.2.2:8080`으로 덮어쓴다 → 카카오 `KOE006`, 구글 `device_id and device_name are required` 발생. **이건 New Architecture 회귀가 아니다.**

EAS 빌드로 검증해야 한다면 `preview` 이상의 프로파일을 쓴다.

- [ ] **Step 4: 콘솔 경고 대조**

Metro 콘솔의 경고·에러를 Task 1 Step 6 기록과 대조한다. **New Architecture 전환 후에만 새로 나타난 것**을 추린다.

특히 아래 유형을 찾는다.

- `Tried to register two views with the same name`
- `... is not a registered callable module`
- ViewManager 관련 인터롭 경고

- [ ] **Step 5: 판정**

- 13개 항목 모두 기준선과 동일 → Task 5로 진행
- 회귀 발견 → **여기서 멈추고 보고한다.** 원인 라이브러리를 특정하고, 되돌릴지 우회할지는 별도 판단이다

되돌리려면 `app.json`을 `false`로 되돌리고 `bun expo prebuild --clean`을 다시 실행한다.

- [ ] **Step 6: 커밋 없음**

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
