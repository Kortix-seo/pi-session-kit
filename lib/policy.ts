// The policy the permission-gate extension applies to a pi tool call.
// Plain, dependency-free logic so it can be read and tested on its own.

export type Action = "allow" | "ask" | "deny";

export interface Rule {
  /** A shell command prefix, matched against the trimmed command. */
  match: RegExp;
  action: Action;
  /** Why the rule exists, printed when the gate stops a call. */
  why: string;
}

export interface Decision {
  action: Action;
  why: string;
}

// Deny is checked first, then ask, then allow. A command that matches none of
// them falls through to `DEFAULT_ACTION`.
export const BASH_RULES: Rule[] = [
  { match: /^rm\s+(-[a-z]*[rf][a-z]*\s+)+/i, action: "deny", why: "recursive delete" },
  { match: /^git\s+push\s+.*(--force|-f)(\s|$)/i, action: "deny", why: "force push rewrites shared history" },
  { match: /^git\s+reset\s+.*--hard/i, action: "deny", why: "hard reset discards uncommitted work" },
  { match: /^(curl|wget)\s+[^|]*\|\s*(sh|bash)\b/i, action: "deny", why: "piping a download into a shell runs an unreviewed script" },
  { match: /^npm\s+publish\b/i, action: "deny", why: "publishing a package from an agent session is irreversible" },
  { match: /^(sudo|doas)\b/i, action: "ask", why: "privilege escalation" },
  { match: /^git\s+push\b/i, action: "ask", why: "a push leaves the machine" },
  { match: /^(gh|glab)\s+(pr|mr)\s+merge\b/i, action: "ask", why: "merging is a person's call by default" },
  { match: /^docker\s+(run|exec)\b/i, action: "ask", why: "runs code outside the session's own files" },
  { match: /^git\s+(status|diff|log|show|branch)\b/i, action: "allow", why: "read-only git" },
  { match: /^(ls|cat|head|tail|wc|grep|rg|find|pwd)\b/i, action: "allow", why: "read-only inspection" },
  { match: /^(npm|pnpm|bun|yarn)\s+(test|run\s+test)\b/i, action: "allow", why: "the test suite" },
  { match: /^(npm|pnpm|bun|yarn)\s+(install|ci|add)\b/i, action: "ask", why: "installs code into the session" },
];

export const DEFAULT_ACTION: Action = "ask";
export const DEFAULT_WHY = "no rule names this command, so a person decides";

/** Paths an agent may read but never write without a person. */
export const PROTECTED_PATHS: RegExp[] = [
  /(^|\/)\.env(\.|$)/i,
  /(^|\/)\.envrc$/i,
  /(^|\/)id_(rsa|ed25519|ecdsa)$/i,
  /(^|\/)\.ssh\//i,
  /(^|\/)\.aws\/credentials$/i,
  /(^|\/)\.pi\/agent\/(settings|mcp)\.json$/i,
];

export function decideBash(command: string): Decision {
  const trimmed = command.trim();
  for (const action of ["deny", "ask", "allow"] as const) {
    for (const rule of BASH_RULES) {
      if (rule.action !== action) continue;
      if (rule.match.test(trimmed)) return { action, why: rule.why };
    }
  }
  return { action: DEFAULT_ACTION, why: DEFAULT_WHY };
}

/** A write or edit to a protected path is a denial, not a prompt: the file is
 *  a credential store, and a person should make that change themselves. */
export function decideWrite(path: string): Decision {
  const normalized = path.replace(/\\/g, "/");
  for (const pattern of PROTECTED_PATHS) {
    if (pattern.test(normalized)) {
      return { action: "deny", why: `${path} holds credentials or session config` };
    }
  }
  return { action: "allow", why: "ordinary project file" };
}
