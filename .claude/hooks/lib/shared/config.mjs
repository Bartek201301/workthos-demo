// Reading workthos.config.json (docs/spec.md, section 3).
//
// Lane C writes this file from a template at install time and lane A reads
// it, so its keys are fixed here:
//
//   {
//     "repository": "owner/name",          GitHub repository
//     "testCommand": "npm test",           the merge test (section 7, step 7)
//     "requiredChecks": ["test (22)"],     checks that must pass on the head SHA
//     "leadDir": "../my-lead",             holds approvals.jsonl
//     "machineDir": "../my-machine",       the merge machine's own state
//     "previewDir": null                   preview worktree of main, or null
//   }
//
// Every key is required except previewDir. Unknown keys are an error, so a
// typo cannot pass unnoticed. A relative dir is relative to the folder that
// holds workthos.config.json; readConfig resolves it to an absolute path.

import { readFile } from 'node:fs/promises';
import path from 'node:path';

const KEYS = ['repository', 'testCommand', 'requiredChecks', 'leadDir', 'machineDir', 'previewDir'];
const DIR_KEYS = ['leadDir', 'machineDir', 'previewDir'];

function configError(message) {
  const err = new Error(`workthos.config.json: ${message}`);
  err.code = 'ECONFIG';
  return err;
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

// Parses and checks the text of workthos.config.json. With baseDir, the
// dirs are resolved against it. Throws an error with code ECONFIG.
export function parseConfig(text, { baseDir } = {}) {
  let data;
  try {
    data = JSON.parse(String(text).replace(/^\uFEFF/, ''));
  } catch (err) {
    throw configError(`not valid JSON (${err.message})`);
  }
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    throw configError('must be a JSON object');
  }
  for (const key of Object.keys(data)) {
    if (!KEYS.includes(key)) throw configError(`unknown key "${key}"`);
  }
  if (!nonEmptyString(data.repository) || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(data.repository)) {
    throw configError('"repository" must be "owner/name"');
  }
  if (!nonEmptyString(data.testCommand)) throw configError('"testCommand" must be a non-empty string');
  if (!Array.isArray(data.requiredChecks) || !data.requiredChecks.every(nonEmptyString)) {
    throw configError('"requiredChecks" must be a list of check names');
  }
  if (!nonEmptyString(data.leadDir)) throw configError('"leadDir" must be a non-empty string');
  if (!nonEmptyString(data.machineDir)) throw configError('"machineDir" must be a non-empty string');
  if (data.previewDir !== undefined && data.previewDir !== null && !nonEmptyString(data.previewDir)) {
    throw configError('"previewDir" must be a non-empty string or null');
  }

  const config = {
    repository: data.repository,
    testCommand: data.testCommand,
    requiredChecks: [...data.requiredChecks],
    leadDir: data.leadDir,
    machineDir: data.machineDir,
    previewDir: data.previewDir ?? null,
  };
  if (baseDir !== undefined) {
    for (const key of DIR_KEYS) {
      if (config[key] !== null) config[key] = path.resolve(baseDir, config[key]);
    }
  }
  return config;
}

// Reads workthos.config.json and resolves its dirs against its folder.
export async function readConfig(file = 'workthos.config.json') {
  const text = await readFile(file, 'utf8');
  return parseConfig(text, { baseDir: path.dirname(path.resolve(file)) });
}
