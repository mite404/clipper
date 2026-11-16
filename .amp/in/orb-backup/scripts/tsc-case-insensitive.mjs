// Type-checks a checkout the way a case-insensitive disk (macOS, Windows) would resolve its imports.
// Usage, from a directory with node_modules: node tsc-case-insensitive.mjs <checkout root>
// Linux resolves './Timeline' and './timeline' to different files; this host makes them the same.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2]);
const ts = createRequire(path.join(root, 'package.json'))('typescript');

// The path as stored on disk, matched without regard to case in its last segment.
const stored = (file) => {
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) return undefined;
  const name = path.basename(file).toLowerCase();
  const hit = fs.readdirSync(dir).find((entry) => entry.toLowerCase() === name);
  return hit && path.join(dir, hit);
};

const config = ts.getParsedCommandLineOfConfigFile(path.join(root, 'tsconfig.json'), {}, {
  ...ts.sys,
  onUnRecoverableConfigFileDiagnostic: (d) => {
    throw new Error(ts.flattenDiagnosticMessageText(d.messageText, '\n'));
  },
});
const host = ts.createCompilerHost(config.options);
host.useCaseSensitiveFileNames = () => false;
host.getCanonicalFileName = (file) => file.toLowerCase();
host.fileExists = (file) => {
  const real = stored(file);
  return Boolean(real) && fs.statSync(real).isFile();
};
host.readFile = (file) => {
  const real = stored(file);
  return real ? fs.readFileSync(real, 'utf8') : undefined;
};
host.getSourceFile = (file, options) => {
  const text = host.readFile(file);
  return text === undefined ? undefined : ts.createSourceFile(file, text, options);
};
host.realpath = (file) => file;

const program = ts.createProgram(config.fileNames, { ...config.options, noEmit: true }, host);
const found = ts.getPreEmitDiagnostics(program).map((d) => {
  const where = d.file ? `${path.relative(root, d.file.fileName)}: ` : '';
  return `${where}TS${d.code} ${ts.flattenDiagnosticMessageText(d.messageText, ' ').slice(0, 150)}`;
});
console.log(found.length ? found.join('\n') : 'no diagnostics');
process.exit(found.length ? 1 : 0);
