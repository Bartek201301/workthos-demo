// The files a Bash command writes, as far as the scope guard looks
// (docs/spec.md, section 6: "simple writes").
//
// It catches output redirections (> >> >| &> &>> <> and >&file), and the
// commands tee, cp, mv and rm, also behind sudo, env, command, nohup, nice,
// timeout, stdbuf, exec, time, "!", and leading VAR=value assignments.
// A "cd" or "pushd" earlier in the same command moves the directory that
// later relative paths start from. It does not see writes made by other
// programs (sed -i, git, node -e, a script), and it does not have to: the
// hard check in the merge machine catches those.
//
// bashWrites returns { writes, unknown }:
//   writes   [{ abs, follow, via }] one entry per file the command would
//            create, change or remove. abs is absolute; follow is false
//            when the last part of the path is not followed if it is a
//            symlink (rm, and the source of mv); via names what writes it.
//   unknown  [text] write targets it cannot work out, such as > "$OUT"
//            with OUT not set, a $(...) in a target, or a "cd -" before a
//            relative target. The caller blocks these.
//
// A directory that rm or mv removes, or that cp -r or mv copies, is listed
// file by file, up to WALK_LIMIT files.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseShell, staticText, wordText } from './shell.mjs';

export const WALK_LIMIT = 2000;

const SKIP_WORDS = new Set(['!', '{', '}', 'then', 'else', 'elif', 'do', 'if', 'while', 'until', 'fi', 'done', 'esac']);
const NOT_COMMANDS = new Set(['for', 'select', 'case', 'function', '[[', 'coproc']);
const WRITE_REDIRECTS = new Set(['>', '>>', '>|', '&>', '&>>', '<>']);

// Each wrapper runs the command that follows its own options. The value is
// the set of its options that take a separate argument.
const WRAPPERS = new Map([
  ['sudo', new Set(['-u', '-g', '-h', '-p', '-C', '-D', '-r', '-t', '-U', '-T'])],
  ['env', new Set(['-u', '-C', '-P', '-S', '--unset', '--chdir'])],
  ['command', new Set()],
  ['builtin', new Set()],
  ['exec', new Set(['-a'])],
  ['nohup', new Set()],
  ['noglob', new Set()],
  ['time', new Set()],
  ['nice', new Set(['-n', '--adjustment'])],
  ['timeout', new Set(['-s', '-k', '--signal', '--kill-after'])],
  ['stdbuf', new Set(['-i', '-o', '-e', '--input', '--output', '--error'])],
]);

const ASSIGNMENT_RE = /^[A-Za-z_][A-Za-z0-9_]*\+?=/;

function isAssignment(word) {
  const first = word.segs[0];
  return Boolean(first && first.t === 'lit' && !first.q && ASSIGNMENT_RE.test(first.s));
}

// Skips options from k: words that start with "-", and the argument of an
// option in withArg. Returns the index of the first word after them.
function skipOptions(words, k, withArg) {
  while (k < words.length) {
    const t = staticText(words[k]);
    if (t === null || !t.startsWith('-') || t === '-') break;
    k++;
    if (t === '--') break;
    if (withArg.has(t)) k++;
  }
  return k;
}

function skipWrapper(name, words, k) {
  if (name === 'command') {
    const t = staticText(words[k]);
    if (t === '-v' || t === '-V') return words.length;
  }
  k = skipOptions(words, k, WRAPPERS.get(name));
  if (name === 'env') while (k < words.length && isAssignment(words[k])) k++;
  if (name === 'timeout') k++;
  return k;
}

function escapeGlob(text) {
  return text.replace(/[*?[\]\\]/g, '\\$&');
}

// Expands a word as Bash would for a file name: ~, $NAME and ${NAME} from
// env (and $PWD, $HOME). Returns { value, pattern, glob } or null when the
// value depends on something only the shell knows.
function expandWord(word, ctx) {
  let value = '';
  let pattern = '';
  let glob = false;
  for (let k = 0; k < word.segs.length; k++) {
    const seg = word.segs[k];
    if (seg.t === 'lit') {
      let s = seg.s;
      if (k === 0 && !seg.q && s.startsWith('~')) {
        if (s !== '~' && !s.startsWith('~/')) return null;
        value += ctx.home;
        pattern += escapeGlob(ctx.home);
        s = s.slice(1);
      }
      value += s;
      pattern += seg.q ? escapeGlob(s) : s;
      if (!seg.q && /[*?[]/.test(s)) glob = true;
    } else if (seg.t === 'var') {
      const v = seg.name === 'PWD' ? ctx.cwd : seg.name === 'HOME' ? ctx.home : ctx.env[seg.name];
      if (typeof v !== 'string') return null;
      value += v;
      pattern += escapeGlob(v);
    } else {
      return null;
    }
  }
  return { value, pattern, glob };
}

function hasGlob(part) {
  return /(^|[^\\])[*?[]/.test(part);
}

// A RegExp for one path segment of a glob pattern.
function segmentRegExp(part) {
  let out = part.startsWith('.') ? '' : '(?!\\.)';
  for (let i = 0; i < part.length; i++) {
    const c = part[i];
    if (c === '\\' && i + 1 < part.length) {
      out += part[++i].replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
    } else if (c === '*') {
      out += '[^/]*';
    } else if (c === '?') {
      out += '[^/]';
    } else if (c === '[' && part.indexOf(']', i + 2) !== -1) {
      const end = part.indexOf(']', i + 2);
      let body = part.slice(i + 1, end);
      const negate = body.startsWith('!') || body.startsWith('^');
      if (negate) body = body.slice(1);
      out += `[${negate ? '^' : ''}${body.replace(/[\\\]^]/g, '\\$&')}]`;
      i = end;
    } else {
      out += c.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
    }
  }
  return new RegExp(`^${out}$`);
}

function exists(p) {
  try {
    fs.lstatSync(p);
    return true;
  } catch {
    return false;
  }
}

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

// The existing paths that match a glob pattern, or null when there are
// more than WALK_LIMIT.
function expandGlob(pattern, cwd) {
  let current = [pattern.startsWith('/') ? '/' : cwd];
  for (const part of pattern.split('/').filter(Boolean)) {
    const next = [];
    if (!hasGlob(part)) {
      const name = part.replace(/\\(.)/g, '$1');
      for (const dir of current) next.push(path.join(dir, name));
    } else {
      const re = segmentRegExp(part);
      for (const dir of current) {
        let names;
        try {
          names = fs.readdirSync(dir).sort();
        } catch {
          continue;
        }
        for (const name of names) if (re.test(name)) next.push(path.join(dir, name));
      }
    }
    if (next.length > WALK_LIMIT) return null;
    current = next;
  }
  return current.filter(exists);
}

// The absolute paths a word names, or null when they cannot be known.
function wordPaths(word, ctx) {
  const e = expandWord(word, ctx);
  if (e === null) return null;
  if (e.value === '') return [];
  if (!path.isAbsolute(e.value) && !ctx.cwd) return null;
  const abs = path.resolve(ctx.cwd ?? '/', e.value);
  if (!e.glob) return [abs];
  const found = expandGlob(e.pattern, ctx.cwd ?? '/');
  if (found === null) return null;
  return found.length ? found : [abs];
}

// The files under a directory, relative to it, or null when there are more
// than WALK_LIMIT. Symlinks are listed, not followed.
function walkFiles(dir) {
  const files = [];
  const stack = [''];
  while (stack.length) {
    const rel = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(path.join(dir, rel), { withFileTypes: true });
    } catch {
      continue;
    }
    entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const entry of entries) {
      const r = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        stack.push(r);
      } else {
        files.push(r);
        if (files.length > WALK_LIMIT) return null;
      }
    }
  }
  return files;
}

// Splits arguments into operands, after the options of cp, mv, rm and tee.
function operandsOf(name, args) {
  const operands = [];
  let targetDir = null;
  let noTargetDir = false;
  let endOptions = false;
  for (let k = 0; k < args.length; k++) {
    const t = staticText(args[k]);
    if (endOptions || t === null || !t.startsWith('-') || t === '-') {
      operands.push(args[k]);
    } else if (t === '--') {
      endOptions = true;
    } else if (name !== 'cp' && name !== 'mv') {
      // rm and tee have no option that takes a separate argument
    } else if (t.startsWith('--')) {
      if (t === '--target-directory' || t === '--suffix') {
        if (t === '--target-directory') targetDir = args[k + 1] ?? null;
        k++;
      } else if (t.startsWith('--target-directory=')) {
        targetDir = { segs: [{ t: 'lit', s: t.slice('--target-directory='.length), q: true }] };
      } else if (t === '--no-target-directory') {
        noTargetDir = true;
      }
    } else {
      for (let c = 1; c < t.length; c++) {
        if (t[c] === 'T') noTargetDir = true;
        if (t[c] === 't' || t[c] === 'S') {
          const rest = t.slice(c + 1);
          const value = rest ? { segs: [{ t: 'lit', s: rest, q: true }] } : args[++k] ?? null;
          if (t[c] === 't') targetDir = value;
          break;
        }
      }
    }
  }
  return { operands, targetDir, noTargetDir };
}

class Collector {
  constructor(ctx) {
    this.ctx = ctx;
    this.writes = [];
    this.unknown = [];
  }

  paths(word) {
    const found = wordPaths(word, this.ctx);
    if (found === null) this.unknown.push(wordText(word));
    return found ?? [];
  }

  add(abs, follow, via) {
    this.writes.push({ abs, follow, via });
  }

  // A path that is removed: a directory counts as every file under it.
  remove(abs, via) {
    let st = null;
    try {
      st = fs.lstatSync(abs);
    } catch {
      // missing: checked as a file
    }
    if (st && st.isDirectory()) {
      const files = walkFiles(abs);
      if (files === null) this.unknown.push(`${abs} (more than ${WALK_LIMIT} files)`);
      else for (const f of files) this.add(path.join(abs, f), false, via);
    } else {
      this.add(abs, false, via);
    }
  }

  // A source copied or moved to base: a directory counts as every file
  // under it, placed under base.
  place(source, base, via) {
    if (isDir(source)) {
      const files = walkFiles(source);
      if (files === null) this.unknown.push(`${source} (more than ${WALK_LIMIT} files)`);
      else if (files.length === 0) this.add(base, via === 'cp', via);
      else for (const f of files) this.add(path.join(base, f), via === 'cp', via);
    } else {
      this.add(base, via === 'cp', via);
    }
  }

  copyOrMove(name, args) {
    const { operands, targetDir, noTargetDir } = operandsOf(name, args);
    let sources;
    let dest;
    let destIsDir;
    if (targetDir) {
      sources = operands;
      dest = this.paths(targetDir)[0];
      destIsDir = true;
    } else {
      if (operands.length < 2) return;
      const last = operands[operands.length - 1];
      sources = operands.slice(0, -1);
      dest = this.paths(last)[0];
      destIsDir = !noTargetDir && (sources.length > 1 || (dest !== undefined && isDir(dest)) || /\/$/.test(staticText(last) ?? ''));
    }
    for (const source of sources.flatMap((w) => this.paths(w))) {
      if (dest !== undefined) this.place(source, destIsDir ? path.join(dest, path.basename(source)) : dest, name);
      if (name === 'mv') this.remove(source, name);
    }
  }

  cd(args) {
    const k = skipOptions(args, 0, new Set());
    if (k >= args.length) {
      this.ctx.cwd = this.ctx.home;
      return;
    }
    const e = expandWord(args[k], this.ctx);
    if (e === null || e.value === '-' || e.glob || (!path.isAbsolute(e.value) && !this.ctx.cwd)) {
      this.ctx.cwd = null;
      return;
    }
    this.ctx.cwd = path.resolve(this.ctx.cwd ?? '/', e.value);
  }

  command(item) {
    const { words } = item;
    let k = 0;
    while (k < words.length && isAssignment(words[k])) k++;
    for (;;) {
      const t = staticText(words[k]);
      if (t === null) break;
      if (SKIP_WORDS.has(t)) k++;
      else if (WRAPPERS.has(t)) k = skipWrapper(t, words, k + 1);
      else break;
    }
    const first = k < words.length ? staticText(words[k]) : null;
    const name = first === null ? null : path.posix.basename(first);

    if (name !== '[[') {
      for (const r of item.redirs) {
        const t = staticText(r.word);
        const toFile = WRITE_REDIRECTS.has(r.op) || (r.op === '>&' && !/^(\d+|-)$/.test(t ?? ''));
        if (!toFile || r.word.segs[0]?.t === 'procsub') continue;
        for (const abs of this.paths(r.word)) this.add(abs, true, 'redirect');
      }
    }
    if (name === null || NOT_COMMANDS.has(name)) return;
    const args = words.slice(k + 1);
    if (name === 'rm') {
      for (const w of operandsOf(name, args).operands) for (const abs of this.paths(w)) this.remove(abs, 'rm');
    } else if (name === 'tee') {
      for (const w of operandsOf(name, args).operands) for (const abs of this.paths(w)) this.add(abs, true, 'tee');
    } else if (name === 'cp' || name === 'mv') {
      this.copyOrMove(name, args);
    } else if (name === 'cd' || name === 'pushd') {
      this.cd(args);
    } else if (name === 'popd') {
      this.ctx.cwd = null;
    }
  }
}

// The files a Bash command writes. cwd is the directory it runs in; env
// gives the values of $NAME; home is ~.
export function bashWrites(command, { cwd = null, env = process.env, home } = {}) {
  const ctx = { cwd, env, home: home ?? env.HOME ?? os.homedir() };
  const collector = new Collector(ctx);
  const stack = [];
  for (const item of parseShell(command).items) {
    if (item.type === 'push') stack.push(ctx.cwd);
    else if (item.type === 'pop') ctx.cwd = stack.length ? stack.pop() : ctx.cwd;
    else collector.command(item);
  }
  return { writes: collector.writes, unknown: collector.unknown };
}
