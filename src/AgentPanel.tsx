// The assistant drawer (CLIP-49): a request box with dictation, the model it asks, and the steps
// it took. The model sees text only: the bridge's snapshot, and transcript lines when ticked.
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Mic, SendHorizontal, X } from 'lucide-react';
import { Choice, IconButton } from './components';
import { DictationModal } from './DictationModal';
import { appendDictation } from './dictation';
import {
  agent,
  OPENROUTER_MODELS,
  PRESETS,
  runRequest,
  type Progress,
  type Provider,
  type TimelineLine,
  type ToolRunner,
} from './agent';

type Preset = keyof typeof PRESETS;
type Entry = { kind: 'you' | 'model' | 'error'; text: string } | { kind: 'step'; step: Progress };
type Step = { ref: string; action: string; args?: unknown[] };
type Outcome = { ok?: boolean; error?: { message?: string } };

// An act step as "action(args) on ref".
const said = (s: Step) => `${s.action}(${(s.args ?? []).join(', ')}) on ${s.ref}`;

// Why the bridge refused an act, or nothing when it took.
function refusal(output: unknown): string {
  const { ok, error } = output as Outcome;
  return ok === false ? ` - refused: ${error?.message}` : '';
}

// A step as one short line for the log: which tool, on what, and whether it took.
function stepLine({ tool, input, output }: Progress): string {
  if (tool !== 'act') return tool === 'transcript' ? 'Read the transcript' : 'Read the timeline';
  const steps = (input as { steps?: Step[] }).steps ?? [];
  return steps.map(said).join('; ') + refusal(output);
}

// The model's tools, run against the bridge; the transcript only when the person ticked it.
function toolRunner(transcript: boolean, lines: () => TimelineLine[]): ToolRunner {
  const tools: Record<string, (args: unknown) => unknown> = {
    snapshot: () => agent.snapshot(),
    query: (args) => agent.query(args as Parameters<typeof agent.query>[0]),
    act: (args) => agent.act(args as Parameters<typeof agent.act>[0]),
  };
  if (transcript) tools.transcript = () => lines();
  return async (name, args) => {
    const tool = tools[name];
    if (!tool) throw new Error(`No tool named ${name}.`);
    return tool(args);
  };
}

// The request log and one request at a time, which Stop aborts.
function useAgentRun(lines: () => TimelineLine[]) {
  const [log, setLog] = useState<Entry[]>([]);
  const [running, setRunning] = useState<AbortController | null>(null);
  const add = (entry: Entry) => setLog((all) => [...all, entry]);

  const run = async (provider: Provider, request: string, transcript: boolean) => {
    const controller = new AbortController();
    setRunning(controller);
    add({ kind: 'you', text: request });
    const options = {
      transcript,
      onStep: (step: Progress) => add({ kind: 'step', step }),
      run: toolRunner(transcript, lines),
    };
    try {
      add({ kind: 'model', text: await runRequest(provider, request, options, controller.signal) });
    } catch (error) {
      if (!controller.signal.aborted)
        add({ kind: 'error', text: error instanceof Error ? error.message : String(error) });
    } finally {
      setRunning(null);
    }
  };
  return { log, running, run };
}

// The model server, the model id, and the OpenRouter key, held only in memory.
function ModelFields({
  preset,
  model,
  apiKey,
  onPreset,
  onModel,
  onKey,
}: {
  preset: Preset;
  model: string;
  apiKey: string;
  onPreset: (next: Preset) => void;
  onModel: (next: string) => void;
  onKey: (next: string) => void;
}) {
  const hosted = preset === 'openrouter';
  return (
    <div className="assistant-model">
      <Choice
        label="Model server"
        value={preset}
        options={(Object.keys(PRESETS) as Preset[]).map((p) => ({
          value: p,
          label: PRESETS[p].label,
        }))}
        onChange={onPreset}
      />
      <input
        aria-label="Model id"
        list={hosted ? 'openrouter-models' : undefined}
        value={model}
        onChange={(e) => onModel(e.target.value)}
      />
      <datalist id="openrouter-models">
        {OPENROUTER_MODELS.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>
      {hosted && (
        <input
          aria-label="OpenRouter key"
          type="password"
          autoComplete="off"
          placeholder="OpenRouter key, kept until reload"
          value={apiKey}
          onChange={(e) => onKey(e.target.value)}
        />
      )}
    </div>
  );
}

// The log: the empty hint, then each request, step and reply in order.
function AgentLog({ log, running }: { log: Entry[]; running: boolean }) {
  return (
    <ol className="assistant-log" aria-live="polite">
      {log.length === 0 && (
        <li className="assistant-empty">
          Ask for a trim or a cut, like “cut the dead air before I start talking”. Each change is
          one Undo.
        </li>
      )}
      {log.map((entry, i) => (
        <li key={i} className={`assistant-${entry.kind}`}>
          {entry.kind === 'step' ? stepLine(entry.step) : entry.text}
        </li>
      ))}
      {running && <li className="assistant-step">Working…</li>}
    </ol>
  );
}

// The opt-in box and the note saying what leaves the page, to whom.
function TranscriptOptIn({
  checked,
  server,
  onChange,
}: {
  checked: boolean;
  server: string;
  onChange: (next: boolean) => void;
}) {
  const what = checked ? 'transcript text and control names' : 'control names only';
  return (
    <>
      <label className="assistant-optin">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        Send transcript text with this request
      </label>
      <p className="assistant-note">{`Sends ${what} to ${server}. Video and audio stay here.`}</p>
    </>
  );
}

// Enter sends and Shift+Enter breaks the line; typing never reaches the editor's shortcuts, but
// Escape does reach the drawer, which closes on it.
function composeKey(event: KeyboardEvent, send: () => void) {
  if (event.key === 'Escape') return;
  event.stopPropagation();
  if (event.key !== 'Enter' || event.shiftKey) return;
  event.preventDefault();
  send();
}

/**
 * The Assistant drawer. Its key lives only in this component's memory and is gone on reload.
 * @param lines the transcript lines on the timeline, sent only when the person ticks the box
 */
export function AgentPanel({
  open,
  onClose,
  lines,
}: {
  open: boolean;
  onClose: () => void;
  lines: () => TimelineLine[];
}) {
  const [preset, setPreset] = useState<Preset>('openrouter');
  const [model, setModel] = useState<string>(OPENROUTER_MODELS[0]);
  const [key, setKey] = useState('');
  const [draft, setDraft] = useState('');
  const [transcript, setTranscript] = useState(false);
  const [dictating, setDictating] = useState(false);
  const { log, running, run } = useAgentRun(lines);
  const input = useRef<HTMLTextAreaElement>(null);

  // After the drawer opens or dictation ends; the box is disabled while dictating, so it waits.
  useEffect(() => {
    if (open && !dictating) input.current?.focus();
  }, [open, dictating]);

  const send = () => {
    const request = draft.trim();
    if (!request || running) return;
    setDraft('');
    void run({ baseUrl: PRESETS[preset].baseUrl, model, key }, request, transcript);
  };

  return (
    <aside
      id="assistant-pane"
      className="assistant"
      aria-label="Assistant"
      data-agent-hidden
      inert={!open}
      data-open={open || undefined}
      onKeyDown={(event) => {
        if (event.key !== 'Escape' || dictating) return;
        event.stopPropagation();
        onClose();
      }}
    >
      <div className="section-title">
        <span>Assistant</span>
        <IconButton label="Close assistant" onClick={onClose}>
          <X size={14} aria-hidden="true" />
        </IconButton>
      </div>
      <ModelFields
        preset={preset}
        model={model}
        apiKey={key}
        onPreset={(next) => {
          setPreset(next);
          setModel(next === 'openrouter' ? OPENROUTER_MODELS[0] : 'llama3.2');
        }}
        onModel={setModel}
        onKey={setKey}
      />
      <AgentLog log={log} running={!!running} />
      <TranscriptOptIn
        checked={transcript}
        server={PRESETS[preset].label}
        onChange={setTranscript}
      />
      <form
        className="assistant-compose"
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
      >
        <textarea
          ref={input}
          aria-label="Request"
          rows={2}
          value={draft}
          disabled={dictating}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(event) => composeKey(event, send)}
        />
        <IconButton label="Dictate" disabled={!!running} onClick={() => setDictating(true)}>
          <Mic size={14} aria-hidden="true" />
        </IconButton>
        {running ? (
          <IconButton label="Stop" onClick={() => running.abort()}>
            <X size={14} aria-hidden="true" />
          </IconButton>
        ) : (
          <IconButton label="Send" type="submit" disabled={!draft.trim()}>
            <SendHorizontal size={14} aria-hidden="true" />
          </IconButton>
        )}
      </form>
      {dictating && (
        <DictationModal
          onCancel={() => setDictating(false)}
          onDone={(text) => {
            setDictating(false);
            setDraft((d) => appendDictation(d, text));
          }}
        />
      )}
    </aside>
  );
}
