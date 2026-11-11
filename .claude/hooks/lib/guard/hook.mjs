// The scope guard: a Claude Code PreToolUse hook (docs/spec.md, section 6).
//
// Claude Code runs it before each Edit, Write, NotebookEdit and Bash call,
// with the call as JSON on stdin ({ cwd, tool_name, tool_input, ... }).
// Exit code 0 lets the call run; exit code 2 blocks it, and Claude sees
// the one line the hook prints on stderr.
//
// On a branch task/<N>-<slug> or ui/<N>-<slug> of the git worktree that
// holds the call's cwd, each file a call writes is judged by where it is:
//   - in this worktree: allowed when it matches the Paths of issue N;
//   - in the main checkout, another worktree of the same repository, or a
//     git dir (which holds the cache): blocked;
//   - anywhere else (temp dirs, the job scratch dir): allowed.
// Before it blocks a file for being outside cached Paths, it reads the issue
// again once, so a scope change in the issue body takes effect at once.
// On any other branch, or outside git, every call is allowed. On a task
// branch it fails closed: when the Paths cannot be read, are empty, or the
// issue is malformed, every write into the worktree is blocked. A Bash
// command with no write in it is never blocked.
//
// Paths are compared after symlinks are resolved, so /tmp/x and
// /private/tmp/x (macOS) are the same file, and a symlink inside the
// worktree that points elsewhere is judged by where it points.

import fs from 'node:fs';
import path from 'node:path';
import { matchAny, parseBranch, toRepoPath } from '../shared/index.mjs';
import { bashWrites } from './bash.mjs';
import { gitContext, loadTaskPaths, worktreeRoots } from './paths.mjs';

const FILE_TOOLS = new Map([
  ['Edit', 'file_path'],
  ['Write', 'file_path'],
  ['MultiEdit', 'file_path'],
  ['NotebookEdit', 'notebook_path'],
]);

// Targets with no file behind them.
const DEVICES = new Set(['/dev/null', '/dev/stdout', '/dev/stderr', '/dev/stdin', '/dev/tty']);

const ALLOW = Object.freeze({ code: 0, message: '' });

function oneLine(text) {
  return String(text).replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500);
}

function block(text) {
  return { code: 2, message: `scope-guard: ${oneLine(text)}` };
}

function firstLine(text) {
  return String(text ?? '').split(/\r?\n/)[0];
}

function isDevice(abs) {
  return DEVICES.has(abs) || /^\/dev\/fd\/\d+$/.test(abs);
}

// The real path of abs: symlinks resolved in every existing part, and in
// the last part only when follow is true. A part that does not exist yet
// is kept as written. Returns null after too many links.
export function realPath(abs, follow = true) {
  let p = path.resolve(abs);
  const rest = [];
  if (!follow && path.dirname(p) !== p) {
    rest.unshift(path.basename(p));
    p = path.dirname(p);
  }
  for (let hops = 0; hops < 64; hops++) {
    try {
      return path.join(fs.realpathSync(p), ...rest);
    } catch {
      let link = null;
      try {
        if (fs.lstatSync(p).isSymbolicLink()) link = fs.readlinkSync(p);
      } catch {
        // p does not exist
      }
      if (link !== null) {
        p = path.resolve(path.dirname(p), link);
        continue;
      }
      const parent = path.dirname(p);
      if (parent === p) return path.join(p, ...rest);
      rest.unshift(path.basename(p));
      p = parent;
    }
  }
  return null;
}

function realDir(dir) {
  try {
    return fs.realpathSync(dir);
  } catch {
    return path.resolve(dir);
  }
}

function within(dir, p) {
  return p === dir || p.startsWith(dir.endsWith(path.sep) ? dir : `${dir}${path.sep}`);
}

// The places of this repository other than the worktree at root, each with
// the words a message uses for it.
function otherPlaces(ctx, root, env) {
  const places = [];
  worktreeRoots(ctx.root, env).forEach((dir, i) => {
    const real = realDir(dir);
    if (real !== root) places.push({ dir: real, what: i === 0 ? 'the main checkout' : 'another worktree' });
  });
  places.push({ dir: realDir(ctx.gitDir), what: 'a git directory' });
  places.push({ dir: realDir(ctx.commonDir), what: 'a git directory' });
  return places;
}

function summary(paths) {
  const shown = paths.slice(0, 6).join(', ');
  return paths.length > 6 ? `${shown}, ...` : shown;
}

// The writes of one tool call: [{ abs, follow, via }], or a block.
function writesOf(input, cwd, env, label) {
  const tool = input.tool_name;
  const toolInput = input.tool_input && typeof input.tool_input === 'object' ? input.tool_input : {};
  if (FILE_TOOLS.has(tool)) {
    const key = FILE_TOOLS.get(tool);
    const file = toolInput[key];
    if (typeof file !== 'string' || file === '') return block(`${label}: the ${tool} call has no ${key}`);
    return [{ abs: path.resolve(cwd, file), follow: true, via: tool }];
  }
  if (tool === 'Bash') {
    if (typeof toolInput.command !== 'string') return [];
    const { writes, unknown } = bashWrites(toolInput.command, { cwd, env });
    if (unknown.length > 0) {
      return block(`${label}: cannot tell which file this command writes (${unknown[0]}); write to a plain path inside the Paths`);
    }
    return writes;
  }
  return [];
}

function cannotRead(label, number, err) {
  if (err.code === 'ETASK') return block(`${label} may change nothing: issue #${number} is malformed (${firstLine(err.message)})`);
  return block(`${label} may change nothing: ${firstLine(err.message)}, and there is no cache`);
}

// The decision for one tool call on task branch `task` of worktree `ctx`.
function decide(input, { ctx, task, env, cwd }) {
  const label = `task #${task.number}`;
  const found = writesOf(input, cwd, env, label);
  if (!Array.isArray(found)) return found;
  const writes = found.filter((w) => !isDevice(w.abs));
  if (writes.length === 0) return ALLOW;

  // Where each file is: this worktree, another place of the repository, or
  // outside the repository and all its worktrees.
  const root = realDir(ctx.root);
  const places = [{ dir: root, what: null }, ...otherPlaces(ctx, root, env)];
  const targets = [];
  for (const w of writes) {
    const real = realPath(w.abs, w.follow);
    if (real === null) return block(`${label}: cannot resolve ${w.abs} (${w.via}): too many symbolic links`);
    let best = null;
    for (const place of places) {
      if (within(place.dir, real) && (best === null || place.dir.length > best.dir.length)) best = place;
    }
    if (best === null) continue;
    if (best.what) return block(`${label} may not change ${w.abs} (${w.via}): it is in ${best.what} of this repository`);
    const rel = toRepoPath(root, real);
    if (rel === null) return block(`${label} may not change ${w.abs} (${w.via}): it is not a file in the repository`);
    targets.push({ rel, via: w.via });
  }
  if (targets.length === 0) return ALLOW;

  const opts = { number: task.number, gitDir: ctx.gitDir, root: ctx.root, env };
  let loaded;
  try {
    loaded = loadTaskPaths(opts);
  } catch (err) {
    return cannotRead(label, task.number, err);
  }
  const noPaths = () => block(`${label} may change nothing: issue #${task.number} has no Paths`);
  if (loaded.paths.length === 0) return noPaths();
  let miss = targets.find((t) => !matchAny(t.rel, loaded.paths));
  if (!miss) return ALLOW;

  // Cached Paths may be old: read the issue once more before blocking.
  let note = '';
  if (loaded.source === 'cache') {
    try {
      loaded = loadTaskPaths({ ...opts, fresh: true });
      if (loaded.paths.length === 0) return noPaths();
      miss = targets.find((t) => !matchAny(t.rel, loaded.paths));
      if (!miss) return ALLOW;
    } catch (err) {
      if (err.code === 'ETASK') return cannotRead(label, task.number, err);
      note = ` (cached; reading the issue again failed: ${firstLine(err.message)})`;
    }
  }
  return block(`${label} may not change ${miss.rel} (${miss.via}): it is outside the Paths: ${summary(loaded.paths)}${note}`);
}

// Runs the hook on the text of stdin. Returns { code, message }: code 0
// allows the call, code 2 blocks it and message is the one line for stderr.
export function runHook({ stdin = '', env = process.env, cwd = process.cwd() } = {}) {
  let input = null;
  try {
    input = JSON.parse(String(stdin));
  } catch {
    input = null;
  }
  if (input === null || typeof input !== 'object' || Array.isArray(input)) input = null;
  const callCwd = input && typeof input.cwd === 'string' && input.cwd !== '' ? input.cwd : cwd;

  let ctx = gitContext(callCwd, env);
  if (ctx === null && env.CLAUDE_PROJECT_DIR) ctx = gitContext(env.CLAUDE_PROJECT_DIR, env);
  const task = ctx ? parseBranch(ctx.branch) : null;
  if (task === null) return ALLOW;

  if (input === null) return block(`task #${task.number}: cannot read the tool call from stdin`);
  try {
    return decide(input, { ctx, task, env, cwd: callCwd });
  } catch (err) {
    return block(`task #${task.number} may change nothing: internal error (${firstLine(err?.message ?? err)})`);
  }
}

// Reads the tool call from stdin, prints the reason on stderr and sets the
// exit code.
export async function main() {
  let stdin = '';
  try {
    process.stdin.setEncoding('utf8');
    for await (const chunk of process.stdin) stdin += chunk;
  } catch {
    // an unreadable stdin is handled as an unreadable tool call
  }
  const result = runHook({ stdin, env: process.env, cwd: process.cwd() });
  if (result.message) process.stderr.write(`${result.message}\n`);
  process.exitCode = result.code;
}
