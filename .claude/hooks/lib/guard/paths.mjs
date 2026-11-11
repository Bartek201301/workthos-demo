// Where a session works and which Paths its task has (docs/spec.md,
// sections 4 and 6).
//
// gitContext asks git for the worktree root, its git dir, the common git
// dir and the branch; worktreeRoots lists every worktree of the repository.
// loadTaskPaths reads the Paths of issue N: from a cache file in the git dir
// when there is one, otherwise with "gh issue view <N> --json body", with
// "--repo <owner/name>" when the worktree has a workthos.config.json. A call
// that finds the cache runs no gh. With fresh: true it skips the cache, so a
// changed issue body takes effect. Only a non-empty list of Paths is cached;
// an issue that now has no Paths, or is malformed, removes the cache. The
// git dir of a linked worktree is its own (.git/worktrees/<name>), so each
// worktree has its own cache.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { checkGlob, parseConfig, taskPaths } from '../shared/index.mjs';

const GIT_TIMEOUT_MS = 10_000;
const GH_TIMEOUT_MS = 30_000;

function git(args, cwd, env) {
  return execFileSync('git', args, {
    cwd,
    env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    timeout: GIT_TIMEOUT_MS,
  });
}

// { root, gitDir, commonDir, branch } for the git work tree that holds cwd,
// or null when cwd is not in one. branch is "refs/heads/<name>", or null
// when HEAD is detached.
export function gitContext(cwd, env = process.env) {
  if (typeof cwd !== 'string' || cwd === '') return null;
  let out;
  try {
    out = git(['rev-parse', '--show-toplevel', '--absolute-git-dir', '--git-common-dir'], cwd, env);
  } catch {
    return null;
  }
  const [root, gitDir, commonDir] = out.split('\n');
  if (!root || !gitDir || !commonDir) return null;
  let branch = null;
  try {
    branch = git(['symbolic-ref', '-q', 'HEAD'], cwd, env).trim() || null;
  } catch {
    branch = null;
  }
  return { root, gitDir, commonDir: path.resolve(cwd, commonDir), branch };
}

// The roots of every worktree of the repository that holds cwd, the main
// checkout first. Empty when git cannot list them.
export function worktreeRoots(cwd, env = process.env) {
  try {
    return git(['worktree', 'list', '--porcelain'], cwd, env)
      .split('\n')
      .filter((line) => line.startsWith('worktree '))
      .map((line) => line.slice('worktree '.length));
  } catch {
    return [];
  }
}

export function cacheFile(gitDir, number) {
  return path.join(gitDir, `workthos-task-${number}.json`);
}

// The cached Paths of task N, or null when there is no usable cache.
export function readCache(gitDir, number) {
  try {
    const data = JSON.parse(fs.readFileSync(cacheFile(gitDir, number), 'utf8'));
    if (data && data.task === number && Array.isArray(data.paths) && data.paths.length > 0) {
      return data.paths.map((glob) => checkGlob(glob));
    }
  } catch {
    // missing or broken: read the issue again
  }
  return null;
}

export function writeCache(gitDir, number, paths) {
  const file = cacheFile(gitDir, number);
  const tmp = `${file}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(tmp, `${JSON.stringify({ task: number, paths, cachedAt: new Date().toISOString() }, null, 2)}\n`);
    fs.renameSync(tmp, file);
  } catch {
    // a cache that cannot be written only costs another gh call
    try {
      fs.rmSync(tmp, { force: true });
    } catch {
      // nothing left to clean up
    }
  }
}

export function removeCache(gitDir, number) {
  try {
    fs.rmSync(cacheFile(gitDir, number), { force: true });
  } catch {
    // a cache that cannot be removed is read again next time
  }
}

// The "repository" of workthos.config.json in root, or null when root has
// no such file. Throws an error with code ECONFIG when the file is invalid.
export function configRepository(root) {
  let text;
  try {
    text = fs.readFileSync(path.join(root, 'workthos.config.json'), 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT' || err.code === 'ENOTDIR') return null;
    const e = new Error(`workthos.config.json: cannot read it (${err.code ?? err.message})`);
    e.code = 'ECONFIG';
    throw e;
  }
  return parseConfig(text).repository;
}

function firstLine(text) {
  return String(text ?? '').split(/\r?\n/).map((l) => l.trim()).find(Boolean)?.slice(0, 200) ?? '';
}

function ghError(message) {
  const err = new Error(message);
  err.code = 'EGH';
  return err;
}

// The body of issue N, read with gh in cwd (and --repo repo when given).
// Throws an error with code EGH.
export function fetchIssueBody(number, { cwd, env = process.env, repo = null } = {}) {
  const args = ['issue', 'view', String(number), '--json', 'body'];
  if (repo) args.push('--repo', repo);
  let out;
  try {
    out = execFileSync('gh', args, {
      cwd,
      env,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: GH_TIMEOUT_MS,
      maxBuffer: 16 * 1024 * 1024,
    });
  } catch (err) {
    let detail = firstLine(err.stderr);
    if (!detail && err.code === 'ENOENT') detail = 'gh is not installed';
    if (!detail && err.signal) detail = `stopped by ${err.signal}`;
    throw ghError(`gh issue view ${number} failed${detail ? `: ${detail}` : ''}`);
  }
  let data;
  try {
    data = JSON.parse(out);
  } catch {
    throw ghError(`gh issue view ${number} did not print JSON`);
  }
  if (!data || typeof data.body !== 'string') throw ghError(`gh issue view ${number} printed no body`);
  return data.body;
}

// The Paths of task N: { paths, source: "cache" | "gh" }. root is the
// worktree root: gh runs there, with --repo from its workthos.config.json.
// Throws an error with code EGH when gh fails, ECONFIG when the config is
// invalid, or ETASK when the issue is malformed.
export function loadTaskPaths({ number, gitDir, root, env = process.env, fresh = false }) {
  if (!fresh) {
    const cached = readCache(gitDir, number);
    if (cached) return { paths: cached, source: 'cache' };
  }
  const repo = configRepository(root);
  let paths;
  try {
    paths = taskPaths(fetchIssueBody(number, { cwd: root, env, repo }));
  } catch (err) {
    if (err.code === 'ETASK') removeCache(gitDir, number);
    throw err;
  }
  if (paths.length > 0) writeCache(gitDir, number, paths);
  else removeCache(gitDir, number);
  return { paths, source: 'gh' };
}
