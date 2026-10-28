# Two places a pi permission rule can live

In Kortix, the open-source AI Operating System, a pi tool call is gated by a
file a colleague can read. Outside it, pi's README states the starting position
plainly: "Pi does not include a built-in
permission system for restricting filesystem, process, network, or credential
access. By default, it runs with the permissions of the user and process that
launched it" (<https://github.com/earendil-works/pi>, read 2026-10-28).

That leaves two honest places to put the rules, and this repo ships both.

## 1. In the runtime's config (the block)

In a Kortix project, a `permission` block decides what an agent's tool calls may
do:

```yaml
permission:
  edit: allow
  bash:
    "*": ask
    "git status": allow
    "git diff *": allow
    "git log *": allow
    "rm -rf *": deny
  webfetch: ask
```

Each rule resolves to `allow`, `ask` or `deny`, and the most specific rule wins,
whatever order the keys are written in. In a v2 project the block lives in the
agent file's frontmatter, `agents/<name>.md`; in a v3 project it lives inside the
`agents.<name>` block of `kortix.yaml`. Source:
<https://kortix.com/docs/project/agents> (read 2026-10-28).

This is the route to prefer when the work runs in Kortix. The rule is config, so
a change to it is a commit a colleague reviews like any other.

## 2. In an extension (this repo)

Outside a runtime that gates calls, pi's documented answer is an extension that
subscribes to `tool_call` and returns `{ block: true, reason }` when a call
should not run (<https://pi.dev/docs/latest/extensions>, read 2026-10-28).
`extensions/permission-gate.ts` does exactly that, with the rules in
`lib/policy.ts`:

- **deny** — a recursive delete, a force push, a hard reset, piping a download
  into a shell, `npm publish`. These are irreversible from inside a session.
- **ask** — a push, a merge, `sudo`, `docker run`, a package install, and any
  command no rule names. A person sees the command and decides.
- **allow** — read-only git, read-only inspection, the test suite.

Writes and edits to credential stores (`.env`, `.envrc`, ssh keys,
`~/.aws/credentials`, `.pi/agent/settings.json`) are denied outright, because a
person should make that change, in a place the repo records.

Every decision is appended to `.pi/permission-gate.log`, so what the gate did is
a file you can read afterwards instead of a moment in a terminal.

## What neither route covers

A rule list bounds tool calls. It does not decide who the agent was working for,
where the machine was, or who read the result. Those are the runtime's job: an
isolated machine per session, a session branch, and a change request a person
merges. See [branch-to-change-request.md](branch-to-change-request.md).
