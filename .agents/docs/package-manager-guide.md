# 패키지 매니저 가이드 (Bun)

이 프로젝트는 `npm` / `npx` 대신 **`bun`** / **`bunx`** 를 사용합니다.

## Bun 설치

### macOS / Linux

```bash
curl -fsSL https://bun.sh/install | bash
```

### Windows (PowerShell)

```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

> 설치 후 터미널을 재시작하거나 `source ~/.bashrc` (또는 `~/.zshrc`)를 실행하여 `PATH`를 적용하세요.

### 설치 확인

```bash
bun --version
```

버전이 출력되면 정상적으로 설치된 것입니다.

---

## npm → bun 명령어 대응표

| npm / npx                  | bun / bunx                  |
| -------------------------- | --------------------------- |
| `npm install`              | `bun install`               |
| `npm install <패키지>`     | `bun add <패키지>`          |
| `npm install -D <패키지>`  | `bun add -d <패키지>`       |
| `npm uninstall <패키지>`   | `bun remove <패키지>`       |
| `npm run <스크립트>`       | `bun run <스크립트>`        |
| `npx <명령어>`             | `bunx <명령어>`             |
| `npx expo start`           | `bunx expo start`           |
| `npx biome check`          | `bunx biome check`          |

---

## 주요 스크립트

```bash
# 의존성 설치
bun install

# Expo 개발 서버 시작
bun run start

# Android 에뮬레이터 실행
bun run android

# iOS 시뮬레이터 실행
bun run ios

# Biome 린트 검사
bunx biome check .

# Biome 자동 수정
bunx biome check --write .
```

---

## 참고

- 공식 문서: https://bun.sh/docs
- Bun은 Node.js와 호환되므로 기존 Node.js 프로젝트에서도 바로 사용할 수 있습니다.
- `bun.lock` 파일이 프로젝트 루트에 존재하며, 이 파일을 통해 의존성 버전을 고정합니다.
