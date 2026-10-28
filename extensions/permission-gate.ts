// The permission gate: the piece pi leaves out, as an extension.
//
// pi's own README says it ships no permission system and that its tools run
// with the permissions of the process that started it. This extension is the
// smallest useful answer to that: it inspects every tool call before the tool
// runs, and it blocks, asks, or allows by the rules in ../lib/policy.ts.
//
// Load it the way pi loads any project extension: put it in
// .pi/extensions/ (or harnesses/pi/extensions/ in a Kortix project), or run
// pi -e ./extensions/permission-gate.ts once.

import { appendFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { type ExtensionAPI, isToolCallEventType } from "@earendil-works/pi-coding-agent";

import { type Decision, decideBash, decideWrite } from "../lib/policy.ts";

const LOG = join(process.cwd(), ".pi", "permission-gate.log");

async function record(line: string): Promise<void> {
  try {
    await mkdir(dirname(LOG), { recursive: true });
    await appendFile(LOG, `${new Date().toISOString()} ${line}\n`);
  } catch {
    // The log is evidence, not a gate. A session without write access to .pi/
    // still gets the decision itself.
  }
}

export default function permissionGate(pi: ExtensionAPI): void {
  pi.on("tool_call", async (event, ctx) => {
    let decision: Decision | undefined;
    let subject = "";

    if (isToolCallEventType("bash", event)) {
      subject = event.input.command;
      decision = decideBash(subject);
    } else if (isToolCallEventType("write", event) || isToolCallEventType("edit", event)) {
      subject = event.input.path;
      decision = decideWrite(subject);
    }

    if (!decision) return;

    await record(`${decision.action}\t${subject}\t${decision.why}`);

    if (decision.action === "deny") {
      ctx.ui.notify(`Blocked: ${decision.why}`, "error");
      return { block: true, reason: `Blocked by the permission gate: ${decision.why}. Change the rule in lib/policy.ts if this call should be allowed.` };
    }

    if (decision.action === "ask") {
      const ok = await ctx.ui.confirm("Run this?", `${subject}\n\n${decision.why}`);
      if (!ok) {
        await record(`denied-by-person\t${subject}\tnobody approved it`);
        return { block: true, reason: "Blocked: the permission gate asked and nobody approved the call." };
      }
    }
  });
}
