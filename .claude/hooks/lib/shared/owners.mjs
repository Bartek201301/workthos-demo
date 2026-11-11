// Reading owners.yml (docs/spec.md, section 5).
//
// owners.yml is a small subset of YAML, parsed here without a dependency:
//
//   lanes:
//     human-ui:   # a comment
//       paths: ["src/ui/tokens/**", "src/ui/theme/**"]
//     docs:
//       paths:
//         - "docs/**"
//
// The only top-level key is "lanes". Each lane has one key, "paths": a list
// of globs (see glob.mjs), written on one line in brackets or as a block of
// "- " items. A glob is in double or single quotes, or unquoted when it uses
// only letters, digits and "_ . / - * ?" and does not start with "*", "?"
// or "-". Comments start with "#". Anything else is an error that names
// the line, so a typo can never quietly widen or drop a lane.
//
// Lane order matters: a file belongs to the first lane, in file order, whose
// paths match it (laneOf). List a narrower lane before a broader one.

import { readFile } from 'node:fs/promises';
import { checkGlob, matchAny, normalizePath } from './glob.mjs';

const KEY_RE = /^([A-Za-z0-9_][A-Za-z0-9_.-]*):(?:[ \t]+(.*))?$/;
const PLAIN_RE = /^[A-Za-z0-9_./][A-Za-z0-9_./*?-]*$/;

function ownersError(line, message) {
  const err = new Error(line ? `owners.yml line ${line}: ${message}` : `owners.yml: ${message}`);
  err.code = 'EOWNERS';
  err.line = line;
  return err;
}

// Removes a "#" comment that is outside quotes and starts the line or
// follows a space.
function stripComment(text) {
  let quote = null;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quote === '"') {
      if (c === '\\') i++;
      else if (c === '"') quote = null;
    } else if (quote === "'") {
      if (c === "'") quote = null;
    } else if (c === '"' || c === "'") {
      quote = c;
    } else if (c === '#' && (i === 0 || text[i - 1] === ' ' || text[i - 1] === '\t')) {
      return text.slice(0, i).trimEnd();
    }
  }
  return text.trimEnd();
}

// Reads one quoted or plain scalar that must fill the whole of text.
function parseScalar(text, line) {
  const s = text.trim();
  if (s === '') throw ownersError(line, 'empty value');
  if (s[0] === '"') {
    let out = '';
    for (let i = 1; i < s.length; i++) {
      const c = s[i];
      if (c === '\\') {
        const next = s[++i];
        if (next === '"' || next === '\\' || next === '/') out += next;
        else throw ownersError(line, `unsupported escape "\\${next ?? ''}" in ${s}`);
      } else if (c === '"') {
        if (i !== s.length - 1) throw ownersError(line, `text after the closing quote in ${s}`);
        return out;
      } else {
        out += c;
      }
    }
    throw ownersError(line, `missing closing quote in ${s}`);
  }
  if (s[0] === "'") {
    let out = '';
    for (let i = 1; i < s.length; i++) {
      const c = s[i];
      if (c === "'") {
        if (s[i + 1] === "'") {
          out += "'";
          i++;
        } else {
          if (i !== s.length - 1) throw ownersError(line, `text after the closing quote in ${s}`);
          return out;
        }
      } else {
        out += c;
      }
    }
    throw ownersError(line, `missing closing quote in ${s}`);
  }
  if (!PLAIN_RE.test(s)) throw ownersError(line, `put ${s} in quotes`);
  return s;
}

// Reads a one-line flow list: [a, "b", 'c'].
function parseFlowList(text, line) {
  const s = text.trim();
  if (!s.startsWith('[')) throw ownersError(line, `expected a list in brackets, got ${s}`);
  if (!s.endsWith(']')) throw ownersError(line, 'a list in brackets must close on the same line');
  const inner = s.slice(1, -1);
  const items = [];
  let quote = null;
  let start = 0;
  for (let i = 0; i <= inner.length; i++) {
    const c = inner[i];
    if (i < inner.length && quote === '"') {
      if (c === '\\') i++;
      else if (c === '"') quote = null;
    } else if (i < inner.length && quote === "'") {
      if (c === "'") quote = null;
    } else if (i < inner.length && (c === '"' || c === "'")) {
      quote = c;
    } else if (i === inner.length || c === ',') {
      items.push(inner.slice(start, i).trim());
      start = i + 1;
    }
  }
  if (quote) throw ownersError(line, `missing closing quote in ${s}`);
  if (items.length === 1 && items[0] === '') return [];
  if (items.length > 1 && items[items.length - 1] === '') items.pop();
  return items.map((item) => {
    if (item === '') throw ownersError(line, `empty item in ${s}`);
    return parseScalar(item, line);
  });
}

function toGlob(value, line) {
  try {
    return checkGlob(value);
  } catch (err) {
    throw ownersError(line, err.message);
  }
}

// Parses the text of owners.yml. Returns { lanes: [{ name, paths }] } in
// file order. Throws an error with code EOWNERS and a line number.
export function parseOwners(text) {
  if (typeof text !== 'string') throw ownersError(0, 'not text');
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
  const lanes = [];
  let sawLanes = false;
  let laneIndent = -1;
  let lane = null;
  let keyIndent = -1;
  let block = null; // { line } while reading "- " items of lane.paths

  const endBlock = () => {
    if (block && lane.paths.length === 0) {
      throw ownersError(block.line, `lane "${lane.name}" has "paths:" with no items; write paths: [] for none`);
    }
    block = null;
  };
  const endLane = () => {
    endBlock();
    if (lane && lane.paths === null) throw ownersError(lane.line, `lane "${lane.name}" has no paths`);
  };

  lines.forEach((raw, index) => {
    const line = index + 1;
    const lead = raw.match(/^[ \t]*/)[0];
    const content = stripComment(raw);
    if (content.trim() === '') return;
    if (lead.includes('\t')) throw ownersError(line, 'indent with spaces, not tabs');
    const indent = lead.length;
    const body = content.trim();

    if (indent === 0) {
      const m = body.match(KEY_RE);
      if (!m || m[1] !== 'lanes') throw ownersError(line, `expected "lanes:", got ${body}`);
      if (sawLanes) throw ownersError(line, '"lanes:" appears twice');
      if (m[2] !== undefined) throw ownersError(line, 'put each lane on its own line under "lanes:"');
      sawLanes = true;
      return;
    }
    if (!sawLanes) throw ownersError(line, 'expected "lanes:" first');

    if (block && indent >= keyIndent && (body === '-' || body.startsWith('- '))) {
      lane.paths.push(toGlob(parseScalar(body.slice(1), line), line));
      return;
    }
    endBlock();

    const m = body.match(KEY_RE);
    if (!m) throw ownersError(line, `cannot read ${body}`);
    const [, key, value] = m;
    if (laneIndent === -1) laneIndent = indent;

    if (indent === laneIndent) {
      endLane();
      if (value !== undefined) throw ownersError(line, `lane "${key}" needs its paths on the next lines`);
      if (lanes.some((l) => l.name === key)) throw ownersError(line, `lane "${key}" appears twice`);
      lane = { name: key, paths: null, line };
      lanes.push(lane);
      keyIndent = -1;
      return;
    }
    if (indent < laneIndent) throw ownersError(line, 'indentation does not match the lanes above');
    if (keyIndent === -1) keyIndent = indent;
    if (indent !== keyIndent) throw ownersError(line, `indentation does not match lane "${lane.name}"`);
    if (key !== 'paths') throw ownersError(line, `unknown key "${key}" in lane "${lane.name}"`);
    if (lane.paths !== null) throw ownersError(line, `lane "${lane.name}" has paths twice`);
    if (value === undefined) {
      lane.paths = [];
      block = { line };
    } else {
      lane.paths = parseFlowList(value, line).map((v) => toGlob(v, line));
    }
  });

  endLane();
  if (!sawLanes) throw ownersError(0, 'no "lanes:" key');
  return { lanes: lanes.map(({ name, paths }) => ({ name, paths })) };
}

// Reads and parses an owners.yml file.
export async function readOwners(file = 'owners.yml') {
  const text = await readFile(file, 'utf8');
  try {
    return parseOwners(text);
  } catch (err) {
    if (err.code === 'EOWNERS') err.message = `${file}: ${err.message}`;
    throw err;
  }
}

// The name of the first lane whose paths match the file, or null when the
// file is in no lane (or is not a path inside the repository).
export function laneOf(owners, file) {
  if (normalizePath(file) === null) return null;
  for (const lane of owners.lanes) {
    if (matchAny(file, lane.paths)) return lane.name;
  }
  return null;
}
