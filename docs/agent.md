# The Assistant

The Assistant (CLIP-49, ADR-38) edits the timeline for you. Open it with **Assistant** in the
header, type or dictate a request, and press Enter. It can trim a clip's start or end and split a
clip, nothing else yet. Each change is one Undo, and a locked track refuses it.

## What leaves the browser

- Video, audio, frames, files and the project never leave the page (ADR-1).
- The model receives text: control names and their values from ui-sdk's agent bridge.
- Transcript lines go only when you tick **Send transcript text with this request**.
- Dictation runs Whisper in the page. The browser's speech service is not used.
- A Content-Security-Policy limits requests to this origin, `https://openrouter.ai` and a local
  Ollama, so a key can't be sent anywhere else.

## Model servers

Both presets speak the OpenAI-compatible `/chat/completions` API.

### OpenRouter

Paste your OpenRouter key in the drawer. It stays in memory and is gone on reload. Use a key made
for Clipper alone, with a spend limit, so revoking it costs nothing. Pick an `anthropic/*`,
`openai/*` or `moonshotai/*` model, or type any OpenRouter model id.

### Ollama on this computer

Install Ollama, pull a model with tool calling (for example `ollama pull llama3.2`), and type its id
in the drawer. No key is needed and nothing leaves your machine.

Ollama accepts browser requests from `localhost` and `127.0.0.1` pages by default. For Clipper on
any other origin, allow that origin:

```sh
OLLAMA_ORIGINS="https://clipper.example.com" ollama serve
```

On macOS with the desktop app, run `launchctl setenv OLLAMA_ORIGINS "https://clipper.example.com"`
and restart Ollama.

llama.cpp's `llama-server` serves the same `/v1/chat/completions` path. Start it on port 11434
(`llama-server -m model.gguf --port 11434 --jinja`) to use the Ollama preset.

## Tests

`tests/agent.spec.ts` drives the bridge directly, runs a mocked model, checks that only text reaches
the model host, and dictates from a fake microphone. CI never calls a real model.
