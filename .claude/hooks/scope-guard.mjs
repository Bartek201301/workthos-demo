#!/usr/bin/env node
// workthos scope guard: the soft scope check of docs/spec.md, section 6.
//
// Claude Code runs this before every Edit, Write, NotebookEdit and Bash call
// (see .claude/settings.json). On a branch task/<N>-<slug> or ui/<N>-<slug>
// it blocks a write outside the Paths of issue N with exit code 2 and one
// line on stderr. On any other branch it allows every call.
//
// The code is in ./lib/guard/ and ./lib/shared/, which workthos init copies
// from src/guard/ and src/shared/. If it cannot be loaded, every call is
// blocked, so a broken install is seen at once.

let hook = null;
try {
  hook = await import('./lib/guard/hook.mjs');
} catch (err) {
  const reason = String(err?.message ?? err).split('\n')[0];
  process.stderr.write(`scope-guard: cannot load .claude/hooks/lib/guard/hook.mjs (${reason}); run workthos init again\n`);
  process.exitCode = 2;
}
if (hook) await hook.main();
