#!/usr/bin/env node
// Fetch the pinned Whisper tiny.en files into public/models (git-ignored), so Clipper serves them
// itself and never downloads a model at runtime (ADR-31). Every file is checked against its SHA-256.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const MODEL = 'onnx-community/whisper-tiny.en';
const REVISION = '794207fec2761281fe63a23a94b7e9f53a4efbc1';
const FILES = {
  'config.json': '251ea843b5901a99efa58c0b99b8052c6019aa3e7d2baf46693a1128ff606233',
  'generation_config.json': '7b2e8451ed5f118e75fdd991409d72119d21d2fef1eba9723f68fb9c57fe5dc9',
  'preprocessor_config.json': 'a6a76d28c93edb273669eb9e0b0636a2bddbb1272c3261e47b7ca6dfdbac1b8d',
  'tokenizer.json': '5eb60cec1e77aeeb6869a2bb5a8e01a84c3fe5d072d75369343021fe6f5310d0',
  'tokenizer_config.json': '93879c3dccdd4b976f709acd85b44778873f30c275e67026f30ca1e4c975230c',
  'onnx/encoder_model_quantized.onnx':
    'e93ec822f16a8fd264e7de972ad17d615ea7334b75a52d54c50c2e18dd503a25',
  'onnx/decoder_model_merged_quantized.onnx':
    'c0592d0749413c960569e1c7fb806b060d5d18f3ebad4a95cbf9a77dc6e9be52',
};
const root = join(dirname(new URL(import.meta.url).pathname), '..', 'public', 'models', MODEL);

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

for (const [file, expected] of Object.entries(FILES)) {
  const target = join(root, file);
  if (existsSync(target) && sha256(readFileSync(target)) === expected) continue;
  const url = `https://huggingface.co/${MODEL}/resolve/${REVISION}/${file}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const actual = sha256(bytes);
  if (actual !== expected) throw new Error(`${file}: SHA-256 ${actual}, expected ${expected}`);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(`${target}.part`, bytes);
  renameSync(`${target}.part`, target);
  console.log(`fetched ${file} (${bytes.length} bytes)`);
}
console.log(`Whisper ${MODEL}@${REVISION.slice(0, 7)} ready in public/models`);
