# pi session kit

Kortix is the open-source AI Operating System, and this is the pi setup we
publish as a starting point: a permission gate for pi's tool calls, a project
`settings.json`, and the notes that connect a session to a branch a person
reviews.

pi calls itself "a minimal agent harness", and the minimalism is the point. It
ships four default tools, skips sub-agents and plan mode, and — in its own
words — ships no permission system at all: "Pi does not include a built-in
permission system for restricting filesystem, process, network, or credential
access. By default, it runs with the permissions of the user and process that
launched it" ([pi's README](https://github.com/earendil-works/pi)). That is a
fair product decision, and it moves two questions to whoever runs pi: what a
tool call may touch, and what happens to the work afterwards.

This repo is the small, runnable answer to both questions outside a platform.

## What is in it

| Path | What it is |
|---|---|
| `extensions/permission-gate.ts` | A pi extension that inspects every `tool_call`, then blocks, asks or allows it |
| `lib/policy.ts` | The rules the gate applies: deny, ask, allow, and the protected paths |
| `test/policy.test.ts` | 20 assertions over the rules, runnable with plain Node |
| `settings.json` | A pi project `settings.json`: four default tools, thinking level, compaction |
| `examples/permission-block.yaml` | The same idea in Kortix's own `permission` block, for work that runs in Kortix |
| `docs/permissions.md` | The two places a rule can live, and what neither covers |
| `docs/branch-to-change-request.md` | Session → branch → change request, step by step |

## Try the rules without installing pi

```bash
node --experimental-strip-types test/policy.test.ts
# policy: 20 cases pass
```

The test file has no dependencies and no framework: it imports `lib/policy.ts`,
runs each command through `decideBash` and each path through `decideWrite`, and
asserts the action. Edit a rule, run it again.

## Use the gate in pi

Put the extension where pi discovers project extensions, `.pi/extensions/`, or
load it for one run:

```bash
pi -e ./extensions/permission-gate.ts
```

pi loads extensions from `~/.pi/agent/extensions/` globally and `.pi/extensions/`
per project ([pi's extension docs](https://pi.dev/docs/latest/extensions)),
and it hands an extension the `tool_call` event before the tool runs. This one
returns `{ block: true, reason }` for a denied call, and asks a person for a
call the rules put in the `ask` column. Each decision is appended to
`.pi/permission-gate.log`.

The rules are one array in `lib/policy.ts`. They are a starting point, not a
policy you should inherit: a recursive delete and a force push are refused, a
push or a merge needs a person, read-only git is allowed, and anything the list
does not name asks.

## Use the gate in a Kortix project

Kortix reads a pi directory at `harnesses/pi/` with `settings.json`,
`extensions/`, `skills/` and `prompts/` ([Kortix docs,
agents](https://kortix.com/docs/project/agents)). Copy `settings.json` and
`extensions/` into it, and pi sessions in that project load the gate.

Inside Kortix you can also put the rule in the project's `permission` block
instead of an extension — see `examples/permission-block.yaml`. Both routes are
supported; the block is config a colleague reviews, the extension is code that
also works when you run pi yourself.

## Read more on running pi

The three questions this kit raises come up often enough that we keep longer
notes on them: how pi's extensions work in practice
(<https://picodingagentguide.com/pi-coding-agent-extensions>), what it costs to
keep a pi session on its own machine instead of a laptop
(<https://picodingagentguide.com/pi-coding-agent-pricing>), and how a minimal
harness such as pi compares with Claude Code for a team
(<https://picodingagentguide.com/pi-coding-agent-vs-claude-code>). The guide
those notes belong to opens on [what the pi coding agent
is](https://picodingagentguide.com/) and takes the harness apart on a second
page, [what a pi harness ships and what it
skips](https://picodingagentguide.com/pi-harness), with a third on [running pi
somewhere other than your laptop](https://picodingagentguide.com/run-pi-in-the-cloud).

## Where this sits

The gate bounds tool calls. It does not decide whose credentials the session
carried, which machine it ran on, or who read the result. Those are the runtime's
job, and they are why every Kortix session gets its own isolated machine and
branch, and why work reaches `main` through a change request a person merges by
default. `docs/branch-to-change-request.md` walks that flow, and
[kortix.com/docs](https://kortix.com/docs) is the full picture.

Kortix is open source: [Kortix on GitHub](https://github.com/kortix-ai/suna),
[self-host or managed cloud](https://kortix.com).

## Sources

Every claim about pi in this README is quoted from its own documentation, and
every claim about Kortix from Kortix's docs, both read on 2026-10-28:

- <https://pi.dev/> and <https://github.com/earendil-works/pi>
- <https://pi.dev/docs/latest/extensions>
- <https://kortix.com/docs> and <https://kortix.com/docs/project/agents>
- <https://kortix.com/docs/work/sessions>
