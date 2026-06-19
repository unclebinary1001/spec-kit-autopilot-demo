# Spec Kit Workflows: `autopilot` vs `implement`

This repository contains two workflows that together automate the
Spec-Driven Development (SDD) lifecycle. **They use two different architectures**:

| File | Architecture | Role | Trigger | Produces |
|------|-------------|------|---------|----------|
| [`speckit-autopilot.yml`](../.github/workflows/speckit-autopilot.yml) | **Plain GitHub Actions** (deterministic) | **Full lifecycle** — runs the *real* spec-kit commands end-to-end | Add the `auto-spec` **label** to an issue | A **pull request** with spec artifacts **and** the implemented code |
| [`speckit-implement.md`](../.github/workflows/speckit-implement.md) | **GitHub Agentic Workflow** (gh-aw) | **Code implementation** — turns artifacts into working code | Comment `/implement` on a **pull request** | **Commits pushed** to that PR's branch |

> **Why two architectures?** `autopilot` needs to invoke the genuine
> `speckit.*` commands via `specify workflow run`, which itself drives a Copilot
> agent for each command. That is a job for a deterministic Actions workflow, not
> for gh-aw (which is designed to drive a *single* agent from a Markdown prompt).
> `implement` is a focused single-agent task, so it stays gh-aw.

`autopilot` already runs the whole lifecycle (including the `implement` step), so
the gh-aw `implement` workflow is a **secondary, on-demand** path — use it to
(re)run implementation on a spec PR by commenting `/implement`.

---

## 1. `speckit-autopilot.yml` — the full lifecycle (deterministic)

This is an ordinary GitHub Actions workflow. There is **no `.md`/`.lock.yml`
compile step** — what you see is what runs.

### How it is triggered

```yaml
on:
  issues:
    types: [labeled]            # fires when ANY label is added…
  workflow_dispatch:            # …or run manually with an issue number
    inputs:
      item_number: { type: string, required: true }
```

A job-level `if:` narrows the label trigger to the right one:

```yaml
if: |
  github.event_name == 'workflow_dispatch' ||
  (github.event_name == 'issues' && github.event.action == 'labeled'
   && github.event.label.name == 'auto-spec')
```

So in practice: **add the `auto-spec` label to an issue** (or dispatch manually
with an issue number). The issue title + body become the feature request.

### What it does

Unlike the gh-aw model, this workflow has **write permissions** and runs a normal
sequence of steps:

1. **Guard** — verifies the triggering user has `write`/`maintain`/`admin`.
2. **Resolve issue context** — reads the issue title + body into a single request
   string (whitespace-collapsed for safe CLI passing).
3. **Remove the `auto-spec` label** and post a 🚀 start comment linking the run.
4. **Set up the toolchain** — Python, `uv`, the Copilot CLI, and the Spec Kit CLI
   (`specify-cli` pinned to `v0.11.2`).
5. **Bootstrap** — `specify init . --here --force --integration copilot` lays down
   the `.specify/` templates and the real `speckit.*` command definitions.
6. **Run the REAL commands** — the key step:
   ```bash
   specify workflow run .github/spec-kit/autopilot-workflow.yml \
     --input "request=${SPEC_REQUEST}"
   ```
   This executes the genuine spec-kit commands in order, each driven by Copilot:
   `speckit.constitution → specify → clarify → plan → tasks → implement`.
7. **Open/update a PR** (`peter-evans/create-pull-request`) on branch
   `speckit/issue-<n>`, labeled `speckit` / `spec-artifacts`.
8. **Report completion** — comments the result + PR link back on the issue.

### The workflow definition it runs

The six steps live in a committed, reviewable file:
[`.github/spec-kit/autopilot-workflow.yml`](../.github/spec-kit/autopilot-workflow.yml).

It is deliberately **gateless** — the *built-in* `speckit` workflow ships with
`review-spec` / `review-plan` human gates that would hang an unattended CI run, so
this repo defines its own gate-free version covering the full lifecycle. The
`constitution` step receives a *principles* instruction (code quality, testing,
UX, performance); the other five receive the raw feature request.

### Output

A single PR containing the spec artifacts (`constitution.md`, `spec.md`,
`plan.md`, `tasks.md`, `research.md`, `data-model.md`, `contracts/`, …) **and the
implemented code** — because the chain ends with `speckit.implement`.

---

## 2. `speckit-implement.md` — implement the code (gh-aw)

This one **is** a GitHub Agentic Workflow. Its `.md` source compiles to a
`.lock.yml`, and **GitHub only ever runs the `.lock.yml`**:

```
speckit-implement.md   ──(gh aw compile)──▶   speckit-implement.lock.yml
   (you edit this)                               (GitHub runs this)
```

> ⚠️ After editing the `.md` **frontmatter**, run `gh aw compile` and commit the
> regenerated `.lock.yml`, or the change won't take effect. Editing only the
> Markdown body does not require recompiling.

### How it is triggered

```yaml
on:
  slash_command:
    name: implement
    events: [pull_request_comment]
  reaction: "rocket"
```

- **`slash_command` / `name: implement` / `events: [pull_request_comment]`** — fires
  when someone comments **`/implement` on a pull request** (typically the PR that
  `autopilot` opened).
- **`reaction: "rocket"`** — adds 🚀 to the triggering comment as acknowledgment.

### What it does (and the safe-outputs security model)

```yaml
engine: copilot
tools:
  edit:
  bash: true
  github:
    toolsets: [pull_requests]   # read-only PR access
permissions:                    # the agent itself is READ-ONLY
  contents: read
  pull-requests: read
network:
  allowed: [defaults, python, node]
safe-outputs:
  push-to-pull-request-branch:  # the ONLY write action it may perform
    title-prefix: "[speckit] "
    protected-files: allowed
    if-no-changes: ignore
timeout-minutes: 45
```

Note the agent has **read-only** permissions yet still pushes commits — that's the
gh-aw **safe-outputs** model: the agent cannot write directly; it emits a
structured request, and a separate permission-scoped job performs the
`push-to-pull-request-branch`. This gives least-privilege execution and
prompt-injection defense.

The agent then executes its Markdown-body prompt:

1. **Read the artifacts** on the PR branch — `.specify/constitution.md`,
   `specs/*/spec.md`, `specs/*/plan.md`, `specs/*/tasks.md`.
2. **Implement `tasks.md` in order** — Setup → Foundational → User Stories
   (P1→P2→P3, TDD if requested) → Polish. `[P]` tasks may be done in any order.
3. **Verify** — confirm planned files exist, run basic validation via `bash`,
   check each user story and constitution principle is satisfied.

### Output

Code is **committed and pushed onto the PR's existing branch**. It treats
`.specify/` and `specs/` as read-only inputs.

---

## How they fit together (end-to-end)

```
┌──────────────────────────────────────────────────────────────────────┐
│ 1. Open an issue describing the feature                                │
│ 2. Add the `auto-spec` label              ──▶  speckit-autopilot.yml    │
│                                                runs the REAL spec-kit   │
│                                                commands end-to-end      │
│ 3. A `[speckit]` PR appears with specs  +  implemented code            │
│ 4. Review the PR                                                       │
│ 5. (optional) Comment `/implement`        ──▶  speckit-implement (gh-aw)│
│                                                re-runs implementation   │
│ 6. Review + merge                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

| Aspect | `speckit-autopilot.yml` | `speckit-implement.md` |
|--------|-------------------------|------------------------|
| **Architecture** | Plain GitHub Actions | gh-aw (`.md` → `.lock.yml`) |
| **Commands run** | Real `speckit.*` via `specify workflow run` | A hand-written implementation prompt |
| **Trigger** | `auto-spec` label on an issue | `/implement` comment on a PR |
| **Trigger event** | `issues: [labeled]` (+ `workflow_dispatch`) | `pull_request_comment` |
| **Permissions** | Write (contents/issues/PRs) | Read-only + `push-to-pull-request-branch` safe-output |
| **Produces** | PR with specs **and** code | Code commits on an existing PR |
| **Timeout** | (job default) | 45 min |
| **Covers full lifecycle?** | ✅ Yes (constitution→implement) | ❌ No (implement only) |

---

## Practical notes

- **Both require the `COPILOT_GITHUB_TOKEN` secret** — a user PAT tied to an
  account with an **active Copilot seat** (fine-grained PATs need the
  `Copilot Requests` permission). Without it, runs fail at the Copilot API
  preflight with HTTP 403.
- **"Allow GitHub Actions to create and approve pull requests"** must be enabled
  (Settings → Actions → General) so `autopilot` can open its PR.
- **The `auto-spec` label must exist** (Issues → Labels) before it can be applied.
- The run is **one-shot and unattended** — there's no human to answer `clarify`
  questions, so treat the resulting PR as a *draft* to review, not a finished
  product.
- `autopilot` is plain YAML and needs **no compile step**. `implement` is gh-aw —
  after editing its `.md` frontmatter, run `gh aw compile` and commit the
  `.lock.yml`.
</content>
