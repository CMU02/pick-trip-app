---
name: git-convention
description: Use when committing, branching, creating worktrees, or opening pull requests in this repository. Defines commit message format and types, branch naming, the worktree workflow, PR rules, and pre-commit checks.
---

# Git Convention

> **⚠️ Do not commit to Git under any circumstances until you are specifically instructed to do so.**

## Husky Hooks

This repository runs husky. The following execute automatically on commit and push.

| Hook | Behavior |
|---|---|
| `pre-commit` | Runs Biome on staged files, applies safe fixes, and re-stages them. **Formatting is handled automatically, so a separate `style` commit is often unnecessary.** If Biome reports an error it cannot fix, the commit is aborted |
| `commit-msg` | Validates that the subject matches `<type>(optional scope): <title>`. **The commit is rejected on violation** |
| `pre-push` | Runs `bun run test:run`. The push is aborted if tests fail |

Never bypass hooks with `--no-verify`.

---

## 1. Commit Types

| Type | When to use |
|------|-------------|
| `feat` | Adding a new feature |
| `fix` | Fixing a bug |
| `docs` | Documentation-only changes (README, comments, wiki) |
| `style` | Style or format changes that do not affect behavior (semicolons, whitespace) |
| `refactor` | Restructuring code without changing behavior |
| `chore` | Routine tasks — build scripts, package manager config, lint settings |
| `perf` | Performance improvements |
| `ci` | CI configuration or script changes |
| `release` | Releasing a version or tagging |

## 2. Commit Message Format

```text
<type>(optional scope): <title>

(optional) Body — explain why, not what

(optional) Footer — issue number, breaking change notice
```

- The first line must match `<type>(optional scope): <title>`. The `commit-msg` hook enforces this.
- **Write the title in Korean.** This is the project default unless instructed otherwise.
- Do not end the title with a period.
- The body explains **why**. The diff already says what changed.

```
# Good — the intent is visible
fix(auth): 소셜 로그인 시작 URL에 client=app 파라미터 추가

백엔드가 state에 클라이언트 타입을 실어 분기하도록 바뀌어,
앱이 모바일 클라이언트임을 알려야 콜백이 커스텀 스킴으로 돌아온다.

# Bad — restates the diff
authService.ts 수정
```

**Examples**

```
feat(auth): 카카오 소셜 로그인 기능 추가
fix(trip): 일정 저장 시 날짜 오류 수정
docs: CONTRIBUTING.md 기여 절차 추가
chore: biome 린터 설정 추가
```

## 3. Commit by Logical Units

> Split the current work into logical units and commit them separately.

### Steps

1. **Review current changes** — `git status` for staged/unstaged, `git diff` for per-file detail.
2. **Group by logical unit** — group related changes together. Each group must be a complete, meaningful unit of work. Classify it using the types above.
3. **Commit each unit in order** — start with the most essential change. Stage selectively with `git add [related files]` and write a message that follows the rules.
4. **Verify** — `git log --oneline -10` for history, `git status` for leftover changes.

### Rules

- Each commit must be meaningful and self-contained.
- Unrelated changes must be committed separately.
- Never commit sensitive files (`.env`, credentials).
- Unless instructed otherwise, write commit messages in Korean.

### Keep Concerns Separate

Do not mix formatting changes with behavior changes. The same goes for refactoring and feature work. Each belongs in its own commit, and ideally its own PR.

```
# Good
refactor: 검증 로직을 공용 유틸로 추출
feat: 회원가입에 전화번호 검증 추가

# Bad
검증 로직 리팩터링하고 전화번호 필드 추가
```

Trivial cleanups such as renaming a variable may ride along in a feature commit.

### Size Your Changes

Smaller changes are easier to review and easier to revert.

```
~100 lines   → easy to review, easy to revert
~300 lines   → acceptable for a single logical change
~1000 lines  → split it
```

**Exception:** purely **mechanical replacements** — renaming a token, updating import paths — are not split regardless of line count. Splitting them leaves intermediate commits that do not compile, which makes reverting harder rather than easier. Such a change must still stand alone and must never be mixed with a design change.

## 4. Pre-Commit Checks

```sh
git diff --staged                    # review what you are committing
git diff --staged | grep -iE "password|secret|api[_-]?key|token"   # scan for secrets
bunx tsc --noEmit                    # type check
bun run lint                         # Biome
bun run test:run                     # tests
```

The `pre-commit` and `pre-push` hooks run Biome and the tests for you, but running them yourself is faster while splitting commits.

### Checklist

- [ ] The commit does one logical thing
- [ ] The message explains why and follows the type conventions
- [ ] Tests pass before committing
- [ ] No secrets in the diff
- [ ] No formatting-only changes mixed with behavior changes

## 5. Change Summary

Report a summary when the work is done. It makes review easier, documents scope discipline, and surfaces unintended changes.

```
CHANGED:
- services/authService.ts: added client=app to the authorization start URL

DELIBERATELY UNTOUCHED:
- services/apiClient.ts: has the same CRLF issue, but it is repo-wide and out of scope
- MainTabNavigator.tsx: the tabPress pattern is wrong, but there is no symptom yet

NEEDS CONFIRMATION:
- nonce is managed server-side keyed by state, so no app change is needed —
  confirm against the backend implementation
```

**The "deliberately untouched" section matters most.** It shows you noticed a problem and still respected the scope.

## 6. Merge Guidelines

Merging happens in two stages. They differ in kind, so they differ in method.

**Worktree branch → work branch (local)**

- Merge with `git merge --ff-only`. See `Worktree Workflow` below for the full procedure.
- If the fast-forward fails, do not paper over it with a merge commit — find out why.

**Work branch → `main` (PR)**

- As a general rule, pull requests are merged via rebase.
- Before rebasing, ensure there are no open issues on the base branch (`main`) and that the branch is up to date.
- Rebasing keeps history linear and avoids unnecessary merge commits.
- If conflicts remain after rebasing, resolve them, retest, then merge.

---

# Branch Naming Convention

- Never commit directly to `main`. Create a work branch instead.
- Branch names follow `<type>/<task-name>`:
  - New features: `feat/<task-name>` (e.g. `feat/bottom-tab-bar`)
  - Refactoring: `refactor/<task-name>` (e.g. `refactor/auth-storage`)
  - Bug fixes: `fix/<task-name>` (e.g. `fix/auth`)
  - Hot fixes: `hotfix/<task-name>` (e.g. `hotfix/oauth-redirect`)
- `<task-name>` is **lowercase English kebab-case**. No Korean, no spaces.  
  It is reused verbatim as the worktree directory name, and it avoids OS and CI tooling issues.
- Do not put the issue number in the branch name.  
  Link issues through `Closes #<number>` in the PR body and through commit footers.
- Delete branches once merged.

> Use `hotfix` for urgent bugs on `main`. Merge it back to `main` immediately.

---

# Worktree Workflow

Work happens in a **separate worktree**, not in the main working copy.  
This keeps the main working copy on `main` for parallel work, and makes a failed attempt easy to throw away wholesale.

## Flow

```
main ─┬─→ fix/auth ────────────────────── (local merge) ──→ push ──→ PR
      └─→ fix/auth-work  (work and commit here) ──┘
```

### 1. Create the work branch and the worktree

```sh
# the real work branch
git switch main
git branch fix/auth

# a worktree branch based on it
git worktree add ../pick-trip-fix-auth -b fix/auth-work fix/auth
```

- Name the worktree branch `<work-branch>-work`.
- Do **not** use a nested path like `fix/auth/work`. Git cannot have `fix/auth` be both a branch and a directory, so it fails with a ref conflict.
- Put the worktree directory in a sibling path outside the repository. Inside the repository, Metro's file watcher and the build tooling will traverse it twice.

### 2. Work in the worktree

```sh
cd ../pick-trip-fix-auth
```

Do the work and commit in logical units. Commits land on `fix/auth-work`.

### 3. Merge locally into the work branch

```sh
cd -                       # main working copy
git switch fix/auth
git merge --ff-only fix/auth-work
```

- Use `--ff-only`. As long as no commits landed on `fix/auth` while you worked, this fast-forwards and history stays linear.
- If the fast-forward fails, `fix/auth` moved unexpectedly. Investigate instead of silently creating a merge commit.

### 4. Clean up the worktree

```sh
git worktree remove ../pick-trip-fix-auth
git branch -d fix/auth-work
```

### 5. Push and PR

**The author pushes and opens the PR themselves.** Automation stops after the local merge; the author reviews the result before proceeding.

```sh
git push -u origin fix/auth
```

Then open a PR for review and CI.

## Caveats

A worktree does not carry untracked files. Running the app from a fresh worktree requires:

- `bun install` — `node_modules/` must exist per worktree
- copying `.env` — it is untracked, so it is absent in the worktree
- `bun expo prebuild` — `android/` is gitignored

Skip this setup for work that does not need to run the app, such as documentation changes.

---

# Pull Requests

- A PR is how code changes get reviewed and adopted by team consensus.
- As a rule, push in small increments and document the reason and scope of the change clearly.
- **The author pushes and opens the PR themselves.** Automation covers up to the local merge of the worktree branch into the work branch; everything after that is the author's call.

### Writing Guidelines

- Write a title that conveys the change at a glance.
- Include the purpose, the key changes, and test results in the description.
- Break down large changes that are hard to review.
- Split unrelated file changes and formatting changes into separate PRs.

### Review Guidelines

- The author explains the intent of the change and anything worth noting first.
- Reviewers check logic, performance, and maintainability — not just style.
- Comments should be specific. Avoid emotional language.
- Verify the core logic and edge cases before approving.

### Merge Criteria

- All required tests pass.
- All review comments are addressed.
- Changes needing functional verification include the verification method.
- After merging, close the related issues and update task status.

### Title Examples

- `fix: 로그인 실패 시 에러메시지 개선`
- `feat: OAuth2 카카오, 구글 로그인 기능 추가`

### PR Body

Follow `.github/pull_request_template.md`.

```text
## 작업 내용
- Summarize the key changes.

## 관련 이슈
- Closes #<issue number>

## 테스트 플랜
- Record how it was verified (tests run, behavior confirmed).
```

---

# Red Flags

Stop and reassess when you see these.

- Large uncommitted changes piling up
- Commit messages like "수정", "업데이트", "기타"
- Formatting changes mixed with behavior changes
- `node_modules/`, `.env`, or build artifacts in a commit
- A work branch that has diverged far from `main`
- Force-pushing to a shared branch
- Worktree branches accumulating without cleanup

# Common Rationalizations

| The thought | The reality |
|---|---|
| "I'll commit once the feature is done" | One giant commit is impossible to review, debug, or revert. Commit each slice |
| "The message doesn't really matter" | Messages are documentation. Future you — and the next agent — needs to know what changed and why |
| "I'll squash it later" | Squashing destroys the narrative of the work. Build it clean from the start |
| "Branches are overhead" | Short-lived branches are free. Long-lived ones are the problem |
| "I'll split this up later" | Large changes are harder to review, riskier to deploy, harder to revert. Split before submitting |
| "Might as well fix the formatting too" | A behavior change buried in a formatting diff is a change no reviewer will see |
