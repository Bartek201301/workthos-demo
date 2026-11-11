// Reading a Bash command well enough to find the files it writes
// (docs/spec.md, section 6). This is not a full shell parser. It knows:
//
//   quotes ('', "", $'', backslash), $VAR and ${VAR}, $(...), `...`,
//   $((...)) and ((...)), <(...) and >(...), subshells ( ... ),
//   the operators ; & && | || |& and newlines, comments,
//   redirections with an optional fd number (2>file, &>file, >&2, <>file),
//   and here-documents (<<EOF and <<-EOF), whose bodies are skipped.
//
// parseShell returns the simple commands in the order they appear, each as
// { type: "cmd", words, redirs }. A command inside $(...), `...`, <(...) or
// ( ... ) comes before the command that holds it, between a { type: "push" }
// and a { type: "pop" } item, so a "cd" inside it can be undone.
//
// A word is { segs }, a list of parts:
//   { t: "lit", s, q }   literal text; q is true when it was quoted
//   { t: "var", name }   $NAME or ${NAME}
//   { t: "sub" }         anything whose value only the shell knows
//   { t: "procsub" }     <(...) or >(...)
// A redirection is { op, fd, word }, with op one of > >> >| &> &>> <> >& < <&
// and <<<. Here-documents are not returned: they only read.

const BLANK = new Set([' ', '\t', '\r']);
const BREAK = new Set([' ', '\t', '\r', '\n', ';', '&', '|', '(', ')', '<', '>']);
const OPERATORS = [';;&', ';;', ';&', '&&', '||', '|&', ';', '&', '|'];
const REDIRECTS = ['&>>', '&>', '<<<', '<<-', '<<', '<>', '<&', '<', '>>', '>|', '>&', '>'];

// The index after the "))" that closes an arithmetic expression whose
// "((" ends just before start, or -1.
function skipArith(src, start) {
  let depth = 2;
  for (let j = start; j < src.length; j++) {
    if (src[j] === '(') depth++;
    else if (src[j] === ')' && --depth === 0) return j + 1;
  }
  return -1;
}

// The index of the "}" that closes a "${" ending just before start, or -1.
function closeBrace(src, start) {
  let depth = 1;
  for (let j = start; j < src.length; j++) {
    const c = src[j];
    if (c === '\\') j++;
    else if (c === "'") {
      j = src.indexOf("'", j + 1);
      if (j === -1) return -1;
    } else if (c === '"') {
      j++;
      while (j < src.length && src[j] !== '"') j += src[j] === '\\' ? 2 : 1;
    } else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return j;
  }
  return -1;
}

function skipOperator(src, i) {
  const op = OPERATORS.find((o) => src.startsWith(o, i));
  return i + (op ? op.length : 1);
}

// The text of a word as written, for messages and here-document delimiters.
export function wordText(word) {
  return word.segs
    .map((seg) => {
      if (seg.t === 'lit') return seg.s;
      if (seg.t === 'var') return `$${seg.name}`;
      if (seg.t === 'procsub') return '<(...)';
      return '$(...)';
    })
    .join('');
}

// The literal value of a word with no expansions in it, or null.
export function staticText(word) {
  if (!word || !word.segs.every((seg) => seg.t === 'lit')) return null;
  return word.segs.map((seg) => seg.s).join('');
}

class Parser {
  constructor(src, items, state) {
    this.src = src;
    this.items = items;
    this.state = state;
    this.heredocs = [];
  }

  fail(message) {
    if (!this.state.error) this.state.error = message;
  }

  // Reads commands from i to the end, or to the ")" that closes a
  // substitution when closer is ")". Returns the index after it.
  seq(i, closer) {
    const { src, items } = this;
    let cmd = { words: [], redirs: [] };
    let depth = 0;
    const flush = () => {
      if (cmd.words.length || cmd.redirs.length) items.push({ type: 'cmd', ...cmd });
      cmd = { words: [], redirs: [] };
    };
    while (i < src.length) {
      const c = src[i];
      const next = src[i + 1];
      if (c === '\\' && next === '\n') {
        i += 2;
      } else if (BLANK.has(c)) {
        i++;
      } else if (c === '\n') {
        flush();
        i = this.heredocBodies(i + 1);
      } else if (c === '#') {
        while (i < src.length && src[i] !== '\n') i++;
      } else if (c === ')') {
        flush();
        i++;
        if (depth > 0) {
          depth--;
          items.push({ type: 'pop' });
        } else if (closer === ')') {
          return i;
        }
      } else if (c === '(') {
        const end = next === '(' && cmd.words.length === 0 ? skipArith(src, i + 2) : -1;
        if (end !== -1) {
          i = end;
        } else {
          flush();
          depth++;
          items.push({ type: 'push' });
          i++;
        }
      } else if ((c === '<' || c === '>') && next === '(') {
        const [word, j] = this.word(i);
        cmd.words.push(word);
        i = j;
      } else if (c === '<' || c === '>' || (c === '&' && next === '>')) {
        i = this.redir(i, null, cmd);
      } else if (c === ';' || c === '&' || c === '|') {
        flush();
        i = skipOperator(src, i);
      } else {
        const io = /^\d+(?=[<>])/.exec(src.slice(i, i + 12));
        if (io) {
          i = this.redir(i + io[0].length, io[0], cmd);
        } else {
          const [word, j] = this.word(i);
          cmd.words.push(word);
          i = j;
        }
      }
    }
    flush();
    for (; depth > 0; depth--) items.push({ type: 'pop' });
    if (closer) this.fail('a "(" is not closed');
    return i;
  }

  redir(i, fd, cmd) {
    const { src } = this;
    const op = REDIRECTS.find((o) => src.startsWith(o, i));
    i += op.length;
    while (i < src.length && BLANK.has(src[i])) i++;
    const procsub = (src[i] === '<' || src[i] === '>') && src[i + 1] === '(';
    if (i >= src.length || (BREAK.has(src[i]) && !procsub)) {
      this.fail(`the redirection "${op}" has no target`);
      return i;
    }
    const [word, j] = this.word(i);
    if (op === '<<' || op === '<<-') {
      this.heredocs.push({ delim: wordText(word), strip: op === '<<-' });
    } else {
      cmd.redirs.push({ op, fd, word });
    }
    return j;
  }

  // Skips the bodies of the here-documents opened on the line that just
  // ended. Returns the index after the last delimiter line.
  heredocBodies(i) {
    const { src } = this;
    for (const doc of this.heredocs) {
      while (i < src.length) {
        let end = src.indexOf('\n', i);
        if (end === -1) end = src.length;
        let line = src.slice(i, end);
        if (doc.strip) line = line.replace(/^\t+/, '');
        i = Math.min(end + 1, src.length);
        if (line === doc.delim) break;
      }
    }
    this.heredocs = [];
    return i;
  }

  word(i) {
    const { src, items } = this;
    const segs = [];
    const lit = (s, q) => {
      if (s === '') return;
      const last = segs[segs.length - 1];
      if (last && last.t === 'lit' && last.q === q) last.s += s;
      else segs.push({ t: 'lit', s, q });
    };
    if ((src[i] === '<' || src[i] === '>') && src[i + 1] === '(') {
      items.push({ type: 'push' });
      const end = this.seq(i + 2, ')');
      items.push({ type: 'pop' });
      return [{ segs: [{ t: 'procsub' }] }, end];
    }
    while (i < src.length && !BREAK.has(src[i])) {
      const c = src[i];
      if (c === '\\') {
        if (src[i + 1] !== '\n') lit(src[i + 1] ?? '', true);
        i += 2;
      } else if (c === "'") {
        const end = src.indexOf("'", i + 1);
        if (end === -1) {
          this.fail('a single quote is not closed');
          lit(src.slice(i + 1), true);
          return [{ segs }, src.length];
        }
        lit(src.slice(i + 1, end), true);
        i = end + 1;
      } else if (c === '"') {
        i = this.doubleQuoted(i + 1, segs, lit);
      } else if (c === '$') {
        i = this.dollar(i, segs, lit, false);
      } else if (c === '`') {
        i = this.backquote(i, segs);
      } else {
        lit(c, false);
        i++;
      }
    }
    return [{ segs }, i];
  }

  doubleQuoted(i, segs, lit) {
    const { src } = this;
    while (i < src.length) {
      const c = src[i];
      if (c === '"') return i + 1;
      if (c === '\\') {
        const n = src[i + 1];
        if (n === '\n') {
          i += 2;
        } else if (n === '$' || n === '`' || n === '"' || n === '\\') {
          lit(n, true);
          i += 2;
        } else {
          lit('\\', true);
          i++;
        }
      } else if (c === '$') {
        i = this.dollar(i, segs, lit, true);
      } else if (c === '`') {
        i = this.backquote(i, segs);
      } else {
        lit(c, true);
        i++;
      }
    }
    this.fail('a double quote is not closed');
    return i;
  }

  dollar(i, segs, lit, quoted) {
    const { src, items } = this;
    const n = src[i + 1];
    if (n === '(') {
      const arith = src[i + 2] === '(' ? skipArith(src, i + 3) : -1;
      if (arith !== -1) {
        segs.push({ t: 'sub' });
        return arith;
      }
      items.push({ type: 'push' });
      const end = this.seq(i + 2, ')');
      items.push({ type: 'pop' });
      segs.push({ t: 'sub' });
      return end;
    }
    if (n === '{') {
      const end = closeBrace(src, i + 2);
      if (end === -1) {
        this.fail('a "${" is not closed');
        segs.push({ t: 'sub' });
        return src.length;
      }
      const inner = src.slice(i + 2, end);
      segs.push(/^[A-Za-z_][A-Za-z0-9_]*$/.test(inner) ? { t: 'var', name: inner } : { t: 'sub' });
      return end + 1;
    }
    const name = /^[A-Za-z_][A-Za-z0-9_]*/.exec(src.slice(i + 1, i + 257));
    if (name) {
      segs.push({ t: 'var', name: name[0] });
      return i + 1 + name[0].length;
    }
    if (n !== undefined && /[0-9@*#?$!-]/.test(n)) {
      segs.push({ t: 'sub' });
      return i + 2;
    }
    if (n === "'" && !quoted) {
      let j = i + 2;
      let text = '';
      while (j < src.length && src[j] !== "'") {
        if (src[j] === '\\' && j + 1 < src.length) {
          text += src[j + 1];
          j += 2;
        } else {
          text += src[j++];
        }
      }
      if (j >= src.length) this.fail('a single quote is not closed');
      lit(text, true);
      return Math.min(j + 1, src.length);
    }
    if (n === '"' && !quoted) return this.doubleQuoted(i + 2, segs, lit);
    lit('$', quoted);
    return i + 1;
  }

  backquote(i, segs) {
    const { src, items } = this;
    let j = i + 1;
    let inner = '';
    while (j < src.length && src[j] !== '`') {
      if (src[j] === '\\' && '`\\$'.includes(src[j + 1] ?? '')) {
        inner += src[j + 1];
        j += 2;
      } else {
        inner += src[j++];
      }
    }
    if (j >= src.length) this.fail('a backquote is not closed');
    items.push({ type: 'push' });
    new Parser(inner, items, this.state).seq(0, null);
    items.push({ type: 'pop' });
    segs.push({ t: 'sub' });
    return Math.min(j + 1, src.length);
  }
}

// Parses a Bash command. Returns { items, error }, where error is null or
// the first syntax problem found. Items found before and after a problem
// are still returned, so a caller can check them.
export function parseShell(source) {
  const items = [];
  const state = { error: null };
  new Parser(String(source ?? ''), items, state).seq(0, null);
  return { items, error: state.error };
}
