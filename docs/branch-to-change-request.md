# From a pi session to a change request

pi keeps a session as a tree in a file. That is the right shape for one person
working at a terminal, and it is not a review. What a team reads is a branch and
a diff, and the runtime is what turns the first into the second. Kortix, the
open-source AI Operating System, is one such runtime; this note follows its
documented flow.

## What Kortix does with a session

The steps below are Kortix's documented flow, checked against
<https://kortix.com/docs/work/sessions> and <https://kortix.com/docs> on
2026-10-28.

1. **A session starts on its own machine.** Each session gets its own isolated
   machine, and the sandbox clones the project repo to `/workspace`. There is
   nothing to install on a laptop, and two sessions on the same project never
   share a working tree.
2. **The session works on a branch whose name is its `session_id`.** A session
   id is a UUID with no prefix, and the sandbox id and the branch name are the
   same string. That one detail is what makes the work traceable later: the diff
   names the session that produced it.
3. **The agent commits and pushes to that branch.** The push stays inside the
   project. It is not the agent reaching into your laptop's ssh config, because
   the machine it runs on is not your laptop.
4. **The agent opens a change request against the default branch.** Work reaches
   `main` through a change request, not through a direct push.
5. **A person reviews the diff and merges.** Merge is default-deny for agents: a
   session can merge its own change request only when its agent's grants include
   `project.gitops.merge`. Without that grant, a person does it.
6. **The branch outlives the machine.** The sandbox is disposable; the branch and
   the change request are not. Stopping a session does not delete the work.

## Why the branch is the unit, not the transcript

A transcript answers "what did the agent say". A diff answers "what changed", and
a change request answers "who agreed to it". If the runtime keeps only the first,
a team inherits a folder of exported HTML and a git history that does not say who
did what.

Two properties follow from keeping the branch:

- **Review happens before the change lands.** A reviewer reads the diff on the
  branch, not the summary an agent wrote about it.
- **The record is in the repo.** The commit, its author and the merge carry
  timestamps anyone with repo access can read, long after the sandbox is gone.

## Running pi this way

You do not need Kortix to try the shape. In any checkout:

```bash
git switch -c session-$(uuidgen)
pi
# work, then:
git add -A && git commit -m "the change, in one line"
git push -u origin HEAD
```

What Kortix adds is that every step above happens on a machine nobody has to
prepare, under a permission block a colleague can read, and that the change
request is the only way work reaches `main`.

More: [Kortix docs, sessions](https://kortix.com/docs/work/sessions) and
[Kortix docs, agents and permissions](https://kortix.com/docs/project/agents).
