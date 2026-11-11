// Reading the task format (docs/spec.md, section 4).
//
// A task is a GitHub issue whose body has these "##" sections: Goal, Paths,
// Uses, Acceptance criteria, Test command, Model, Out of scope. Headings
// match without regard to case or a trailing ":". Text before the first
// heading, HTML comments and fenced code blocks never count as headings or
// list items. A "#" heading ends a section; "###" and deeper stay inside it.
//
// Paths and Uses are lists ("-", "*", "+" or "1."). Each item is one glob:
// the first `code span` in the item when it has one, otherwise the whole
// item. A missing or empty Paths section means the task may change nothing.
// An item that is not one glob, or a known section that appears twice, is
// an error (code ETASK), so a malformed issue fails closed.

import { checkGlob } from './glob.mjs';

const SECTIONS = new Map([
  ['goal', 'goal'],
  ['paths', 'paths'],
  ['uses', 'uses'],
  ['acceptance criteria', 'acceptance'],
  ['test command', 'testCommand'],
  ['model', 'model'],
  ['out of scope', 'outOfScope'],
]);

const LIST_ITEM_RE = /^(\s*)(?:[-*+]|\d{1,9}[.)])[ \t]+(.*)$/;
const CHECKBOX_RE = /^\[[ xX]\][ \t]+/;

function taskError(message) {
  const err = new Error(message);
  err.code = 'ETASK';
  return err;
}

function stripHtmlComments(text) {
  return text.replace(/<!--[\s\S]*?(?:-->|$)/g, '');
}

// Splits text into lines and marks the ones inside fenced code blocks.
function scanLines(text) {
  const out = [];
  let fence = null;
  for (const line of String(text ?? '').split(/\r?\n/)) {
    const m = line.match(/^ {0,3}(`{3,}|~{3,})/);
    if (fence) {
      const close = m && m[1][0] === fence[0] && m[1].length >= fence.length && line.trim() === m[1];
      out.push({ line, fenced: true, fenceMark: Boolean(close) });
      if (close) fence = null;
    } else if (m) {
      fence = m[1];
      out.push({ line, fenced: true, fenceMark: true });
    } else {
      out.push({ line, fenced: false, fenceMark: false });
    }
  }
  return out;
}

// Returns a Map from a normalized heading (lowercase, single spaces, no
// trailing ":") to the scanned lines of its section.
export function parseSections(body) {
  const sections = new Map();
  let current = null;
  for (const entry of scanLines(stripHtmlComments(String(body ?? '')))) {
    if (!entry.fenced) {
      const h = entry.line.match(/^ {0,3}(#{1,6})[ \t]+(.*?)[ \t#]*$/);
      if (h && h[1].length <= 2) {
        if (h[1].length === 1) {
          current = null;
          continue;
        }
        const name = h[2].replace(/:$/, '').replace(/\s+/g, ' ').trim().toLowerCase();
        if (sections.has(name) && SECTIONS.has(name)) {
          throw taskError(`the section "## ${h[2].trim()}" appears twice`);
        }
        current = [];
        if (!sections.has(name)) sections.set(name, current);
        continue;
      }
    }
    if (current) current.push(entry);
  }
  return sections;
}

// The items of a Markdown list, with checkboxes removed. An indented line
// that is not an item continues the item above it.
function listItems(entries) {
  const items = [];
  let open = false;
  for (const { line, fenced } of entries) {
    if (fenced) {
      open = false;
      continue;
    }
    const m = line.match(LIST_ITEM_RE);
    if (m) {
      items.push(m[2].replace(CHECKBOX_RE, '').trim());
      open = true;
    } else if (open && /^\s+\S/.test(line)) {
      items[items.length - 1] = `${items[items.length - 1]} ${line.trim()}`.trim();
    } else {
      open = false;
    }
  }
  return items.filter((item) => item !== '');
}

function globItems(entries, section) {
  return listItems(entries).map((item) => {
    const spans = [...item.matchAll(/`([^`]+)`/g)];
    if (spans.length > 1) throw taskError(`${section}: "${item}" has more than one glob; use one item per glob`);
    const value = (spans.length ? spans[0][1] : item).trim();
    if (/\s/.test(value)) {
      throw taskError(`${section}: "${item}" is not one glob; put the glob in backticks`);
    }
    try {
      return checkGlob(value);
    } catch (err) {
      throw taskError(`${section}: ${err.message}`);
    }
  });
}

function plainText(entries) {
  if (!entries) return null;
  const text = entries.map((e) => e.line).join('\n').trim();
  return text === '' ? null : text;
}

function commandText(entries) {
  if (!entries) return null;
  const firstFence = entries.findIndex((e) => e.fenced && e.fenceMark);
  if (firstFence !== -1) {
    const inside = [];
    for (const e of entries.slice(firstFence + 1)) {
      if (e.fenceMark || !e.fenced) break;
      inside.push(e.line);
    }
    const text = inside.join('\n').trim();
    return text === '' ? null : text;
  }
  const text = plainText(entries);
  if (text === null) return null;
  const span = text.match(/^`([^`]+)`$/);
  return span ? span[1].trim() : text;
}

// Parses an issue body in the task format. Returns
// { goal, paths, uses, acceptance, testCommand, model, outOfScope }.
// paths, uses and acceptance are arrays (empty when the section is missing);
// the others are strings or null. model is lowercase, as written.
export function parseTask(body) {
  const sections = parseSections(body);
  const get = (name) => sections.get(name);
  const model = plainText(get('model'));
  return {
    goal: plainText(get('goal')),
    paths: get('paths') ? globItems(get('paths'), 'Paths') : [],
    uses: get('uses') ? globItems(get('uses'), 'Uses') : [],
    acceptance: get('acceptance criteria') ? listItems(get('acceptance criteria')) : [],
    testCommand: commandText(get('test command')),
    model: model === null ? null : model.replace(/`/g, '').trim().toLowerCase(),
    outOfScope: plainText(get('out of scope')),
  };
}

// The globs of the Paths section of an issue body.
export function taskPaths(body) {
  return parseTask(body).paths;
}

// The task number N from the line "Task: #N" of a PR body, or null when
// there is none. Throws (ETASK) when two lines name different tasks.
export function parseTaskRef(prBody) {
  const found = new Set();
  for (const { line, fenced } of scanLines(stripHtmlComments(String(prBody ?? '')))) {
    if (fenced) continue;
    const m = line.match(/^\s*Task:[ \t]*#([1-9]\d*)\s*$/);
    if (m) found.add(Number(m[1]));
  }
  if (found.size > 1) throw taskError(`the PR body names more than one task: ${[...found].map((n) => `#${n}`).join(', ')}`);
  return found.size === 1 ? [...found][0] : null;
}

// Reads a branch name of the form task/<N>-<slug> or ui/<N>-<slug>
// (a leading "refs/heads/" is allowed). Returns { kind, number, slug },
// where kind is "task" or "ui", or null for any other branch.
export function parseBranch(name) {
  if (typeof name !== 'string') return null;
  const m = name.trim().replace(/^refs\/heads\//, '').match(/^(task|ui)\/([1-9]\d*)-([A-Za-z0-9._-]+)$/);
  return m ? { kind: m[1], number: Number(m[2]), slug: m[3] } : null;
}
