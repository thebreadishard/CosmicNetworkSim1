# AGENTS.md — Cosmic Network Simulator

Real-time 3D visualization (Three.js + TypeScript + Vite) of galactic
civilizations emerging and connecting via radio waves. Primary rendering cost:
tens of thousands of individual star meshes across several galaxies.

## Development process

All work follows this cycle. It exists because a previous big-bang feature
branch (`feature/cosmic-web-lod`) accumulated ~1,250 lines that never merged.

1. **Issue first.** Every unit of work starts as a GitHub issue with a short
   acceptance criteria list. One issue = one branch = one PR.
2. **Branch.** `feature/<issue-number>-<short-slug>` from up-to-date `main`.
   Never commit directly to `main`.
3. **Implement** the smallest change that meets the acceptance criteria.
4. **Self-verify** (see Commands below) before claiming anything works.
5. **Independent review.** Spawn the `reviewer` subagent (`.vibe/agents/reviewer.toml`)
   with the diff and the issue's acceptance criteria. It reviews without seeing
   the implementer's reasoning. Address its findings.
6. **Test.** Spawn the `tester` subagent (`.vibe/agents/tester.toml`) to run the
   e2e suite and exercise the changed behavior. Fix failures.
7. **PR.** Push the branch and open a PR referencing the issue
   (`gh pr create`).
8. **Manual check.** The user opens the PR branch (dev server or preview) and
   verifies it by hand. No merge happens before this.
9. **Merge.** Merge to `main` only after reviewer + tester pass **and** the
   user has manually approved. Never merge on the agent's own initiative.

### Authorization rules

- `git push` to **new `feature/*` branches** is pre-authorized by the repo owner.
- Pushing to `main`, force-pushes, and deleting branches require explicit
  approval, every time.

### Definition of done

- Acceptance criteria of the issue demonstrably met (checked against real
  execution output, not assumptions).
- `npm run build`, `npm run lint`, and `npm run test:e2e` pass.
- Reviewer and tester subagents ran and their findings are resolved or
  explicitly deferred to a new issue.
- The user manually verified the branch in the browser and approved the merge.
- PR description states what changed, why, and how it was verified.

## Smaller-steps roadmap (issues #1–#5)

Lessons from the abandoned LOD branch: don't hide stars before visuals are
proven, don't hand-tune world-unit thresholds, keep simulation logic separate
from rendering.

1. Baseline: pin current behavior (e2e run + reference screenshot).
2. Distance-based sprite fallback *without* hiding stars; on-screen pixel size
   as the switch criterion, not fixed world-unit thresholds.
3. Sim-level LOD: pause civilization/network updates for far galaxies
   (separate from rendering).
4. Real-data view, read-only: render catalog galaxies without changing
   simulation mechanics; toggle off by default.
5. Cosmic web layer: filament visuals at the far level.

## Commands

- Dev server: `npm run dev` (Vite, port 3000)
- Build + typecheck: `npm run build` (`tsc && vite build`)
- Lint: `npm run lint`
- E2E tests: `npm run test:e2e` (Playwright; `tests/e2e/`, browser: Edge,
  expects the dev server on `localhost:3000`)

## Conventions

- TypeScript strict; match existing code style (2-space indent, JSDoc on
  public members where the file already does).
- Simulation logic lives in `src/networkManager.ts` and `src/entities.ts`;
  rendering/entry in `src/main.ts`. New subsystems get their own module under
  `src/` (e.g. `src/lod/`).
- Comments explain non-obvious constraints only — no narration.
- Performance matters: any change to the per-frame loop must state its
  per-frame cost in the PR description.
