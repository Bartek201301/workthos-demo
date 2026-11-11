// Matching repository file paths against globs.
//
// This is the one glob dialect of workthos. The Paths and Uses of a task
// (docs/spec.md, section 4) and the lane paths in owners.yml (section 5)
// all use it, so the scope hook, the merge machine and the integrator agree.
//
// A path is relative to the repository root and uses "/" (as git prints it).
// A glob is anchored at the repository root:
//   *    any characters except "/", including none
//   ?    one character except "/"
//   **   as a whole segment: any number of segments, including none
//        ("src/**" is every file under src/, "**/x.mjs" is x.mjs at any depth)
//   dir/ a glob that ends in "/" is the same as "dir/**"
// Everything else matches itself. There are no character classes and no
// braces. Matching is case sensitive. Dot files get no special treatment,
// so "*" and "**" match them too.
//
// A path that leaves the repository ("../x", "/etc/x", "a/../../x") never
// matches. A path is normalized first, so "src/a/../b.mjs" is "src/b.mjs".

import path from 'node:path';

function globError(glob, reason) {
  const err = new Error(`bad glob ${JSON.stringify(glob)}: ${reason}`);
  err.code = 'EGLOB';
  return err;
}

// Returns the normalized form of a repository path, or null when it is not
// a path inside the repository.
export function normalizePath(file) {
  if (typeof file !== 'string' || file === '' || file.includes('\0')) return null;
  if (file.startsWith('/')) return null;
  const norm = path.posix.normalize(file);
  if (norm === '.' || norm === '..' || norm.startsWith('../')) return null;
  return norm.endsWith('/') ? norm.slice(0, -1) : norm;
}

// Turns a file path (absolute, or relative to the current directory) into a
// repository path, relative to root. Returns null when it is outside root.
// It does not resolve symlinks; callers that need that use fs.realpath first.
export function toRepoPath(root, file) {
  const abs = path.resolve(root, file);
  const rel = path.relative(path.resolve(root), abs);
  if (rel === '' || path.isAbsolute(rel)) return null;
  return normalizePath(rel.split(path.sep).join('/'));
}

// Checks a glob and returns its normalized form. Throws an error with
// code EGLOB when the glob is empty or leaves the repository.
export function checkGlob(glob) {
  if (typeof glob !== 'string') throw globError(glob, 'not a string');
  let g = glob.trim();
  if (g === '') throw globError(glob, 'empty');
  if (g.includes('\0')) throw globError(glob, 'contains a NUL byte');
  while (g.startsWith('./')) g = g.slice(2);
  if (g === '') throw globError(glob, 'empty');
  if (g.startsWith('/')) throw globError(glob, 'must be relative to the repository root');
  const dirOnly = g.endsWith('/');
  const segments = g.split('/').filter((s, i, all) => s !== '' || i === all.length - 1);
  if (dirOnly) segments.pop();
  if (segments.length === 0) throw globError(glob, 'empty');
  for (const s of segments) {
    if (s === '.' || s === '..') throw globError(glob, 'must not contain "." or ".." segments');
  }
  return segments.join('/') + (dirOnly ? '/' : '');
}

function segmentSource(segment) {
  let out = '';
  for (let i = 0; i < segment.length; i++) {
    const c = segment[i];
    if (c === '*') {
      while (segment[i + 1] === '*') i++;
      out += '[^/]*';
    } else if (c === '?') {
      out += '[^/]';
    } else {
      out += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    }
  }
  return out;
}

const cache = new Map();

// Returns a RegExp that tests a normalized repository path.
export function globToRegExp(glob) {
  const norm = checkGlob(glob);
  const cached = cache.get(norm);
  if (cached) return cached;
  const segments = (norm.endsWith('/') ? norm + '**' : norm).split('/');
  let source = '';
  segments.forEach((segment, i) => {
    const last = i === segments.length - 1;
    if (segment === '**') {
      source += last ? '[^/]+(?:/[^/]+)*' : '(?:[^/]+/)*';
    } else {
      source += segmentSource(segment) + (last ? '' : '/');
    }
  });
  const re = new RegExp(`^${source}$`);
  cache.set(norm, re);
  return re;
}

// True when the repository path matches the glob.
export function matchGlob(file, glob) {
  const p = normalizePath(file);
  if (p === null) return false;
  return globToRegExp(glob).test(p);
}

// True when the repository path matches at least one of the globs.
export function matchAny(file, globs) {
  const p = normalizePath(file);
  if (p === null) return false;
  return globs.some((g) => globToRegExp(g).test(p));
}
