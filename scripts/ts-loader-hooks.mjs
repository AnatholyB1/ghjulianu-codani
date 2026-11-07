import { readFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXTS = ['.ts', '.tsx', '.js', '.mjs'];

function tryResolve(base) {
  if (existsSync(base) && statSync(base).isFile()) return base;
  for (const e of EXTS) if (existsSync(base + e)) return base + e;
  for (const e of EXTS) {
    const p = path.join(base, 'index' + e);
    if (existsSync(p)) return p;
  }
  return null;
}

export async function resolve(specifier, context, next) {
  if (specifier === 'server-only') return { url: 'data:text/javascript,export {}', shortCircuit: true };
  let base = null;
  if (specifier.startsWith('@/')) base = path.join(ROOT, 'src', specifier.slice(2));
  else if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL?.startsWith('file:')) {
    base = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
  }
  if (base) {
    const hit = tryResolve(base);
    if (hit) return { url: pathToFileURL(hit).href, shortCircuit: true };
  }
  if (/^next\/[a-z-]+$/.test(specifier)) return next(specifier + '.js', context); // next ships CJS entry files without exports map
  return next(specifier, context);
}

export async function load(url, context, next) {
  if (url.startsWith('file:') && /\.(ts|tsx)$/.test(url) && !url.includes('node_modules')) {
    const src = await readFile(fileURLToPath(url), 'utf8');
    const out = ts.transpileModule(src, {
      fileName: fileURLToPath(url),
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    });
    return { format: 'module', source: out.outputText, shortCircuit: true };
  }
  return next(url, context);
}
