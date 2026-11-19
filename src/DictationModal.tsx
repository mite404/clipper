// The assistant's dictation modal (CLIP-49), after yaklabs ADR-028: typing pauses behind a modal
// with a centre-playhead waveform, a live transcript preview and a microphone picker. Esc cancels;
// Enter or Done inserts. Words come from Whisper in the page (src/dictation.ts), next to this file.
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Choice } from './components';
import { formatElapsed, record, type AudioDevice } from './dictation';

// One sample every TICK_MS, drawn as a BAR px bar with GAP px after it.
const TICK_MS = 45;
const BAR = 3;
const STEP = 6;

// A CSS custom property's colour on the canvas, or the fallback when the theme lacks it.
function cssColor(el: Element, name: string, fallback: string) {
  return getComputedStyle(el).getPropertyValue(name).trim() || fallback;
}

// Matches the canvas's backing store to its CSS size at this pixel ratio; → its CSS [width, height].
function fitCanvas(el: HTMLCanvasElement, ctx: CanvasRenderingContext2D): [number, number] {
  const dpr = devicePixelRatio || 1;
  const [w, h] = [el.clientWidth, el.clientHeight];
  if (el.width !== Math.round(w * dpr)) el.width = Math.round(w * dpr);
  if (el.height !== Math.round(h * dpr)) el.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return [w, h];
}

// Adds a level, newest first, for each TICK_MS since `last`; → the time of the latest tick.
function sample(levels: number[], read: () => number, now: number, last: number): number {
  let at = now - last > 1000 ? now - TICK_MS : last; // a hidden tab resumes from now
  for (; now - at >= TICK_MS; at += TICK_MS) levels.unshift(read());
  return at;
}

// The dotted line ahead of the playhead, then the bars behind it, fading to the left.
function paintBars(
  ctx: CanvasRenderingContext2D,
  levels: number[],
  [w, h]: [number, number],
  drift: number,
) {
  const head = Math.round(w / 2);
  const mid = h / 2;
  levels.length = Math.min(levels.length, Math.ceil(head / STEP) + 2);
  ctx.globalAlpha = 0.35;
  for (let x = head + 10; x < w; x += STEP) ctx.fillRect(x, mid - 1, 2, 2);
  levels.forEach((level, i) => {
    const x = head - 6 - (i + drift) * STEP;
    if (x < -BAR) return;
    const bar = Math.max(3, level * (h - 12));
    ctx.globalAlpha = 0.25 + 0.75 * Math.max(0, x / head);
    ctx.beginPath();
    ctx.roundRect(x, mid - bar / 2, BAR, bar, BAR / 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

// Starts the waveform's animation loop on a canvas; → a function that stops it.
function animate(el: HTMLCanvasElement, ctx: CanvasRenderingContext2D, read: () => number) {
  const ink = cssColor(el, '--foreground', '#ddd');
  const accent = cssColor(el, '--primary', '#9bbf6a');
  const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const levels: number[] = [];
  let last = performance.now();
  let frame = 0;
  const draw = (now: number) => {
    const size = fitCanvas(el, ctx);
    last = sample(levels, read, now, last);
    ctx.fillStyle = ink;
    paintBars(ctx, levels, size, smooth ? (now - last) / TICK_MS : 0);
    ctx.fillStyle = accent;
    ctx.fillRect(Math.round(size[0] / 2) - 1, 6, 2, size[1] - 12);
    frame = requestAnimationFrame(draw);
  };
  frame = requestAnimationFrame(draw);
  return () => cancelAnimationFrame(frame);
}

/**
 * A DAW-style recording waveform: the playhead stays at the centre, new audio enters there and
 * scrolls left, and a dotted line marks the empty timeline ahead.
 */
function Waveform({ read }: { read: () => number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const reader = useRef(read);
  useEffect(() => {
    reader.current = read;
  });
  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext('2d');
    if (el && ctx) return animate(el, ctx, () => reader.current());
  }, []);
  return (
    <canvas
      ref={canvas}
      className="dictation-wave"
      role="img"
      aria-label="Live audio waveform, newest sound at the centre"
    />
  );
}

// Milliseconds since the modal opened, ticking four times a second.
function useElapsed() {
  const [started] = useState(() => performance.now());
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const clock = setInterval(() => setElapsed(performance.now() - started), 250);
    return () => clearInterval(clock);
  }, [started]);
  return elapsed;
}

// Records from one microphone, restarting when it changes; the level is a ref for the canvas.
function useTake(deviceId: string) {
  const level = useRef(0);
  const take = useRef<ReturnType<typeof record> | null>(null);
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState<string>();
  useEffect(() => {
    const recording = record(deviceId, {
      onLevel: (value) => (level.current = value),
      onDevices: setDevices,
      onText: setText,
      onError: setError,
    });
    take.current = recording;
    return () => recording.cancel();
  }, [deviceId]);
  // Hands over the take once, for its final pass; later calls get nothing.
  const stop = () => {
    const recording = take.current;
    take.current = null;
    return recording;
  };
  return { level, stop, devices, text, error };
}

// The status line and the microphone picker; the picker shows System Default until devices load.
function DictationHeader({
  finishing,
  elapsed,
  deviceId,
  devices,
  onDevice,
}: {
  finishing: boolean;
  elapsed: number;
  deviceId: string;
  devices: AudioDevice[];
  onDevice: (id: string) => void;
}) {
  const options = devices.length
    ? devices.map((d) => ({ value: d.id, label: d.label }))
    : [{ value: 'default', label: 'System Default' }];
  return (
    <header className="dictation-header">
      <p id="dictation-title">
        <span className="rec-dot" aria-hidden="true" />
        {finishing ? 'Transcribing' : 'Listening'}
        <span className="dictation-time">{formatElapsed(elapsed)}</span>
      </p>
      <Choice
        label="Microphone"
        value={deviceId}
        disabled={finishing}
        options={options}
        onChange={onDevice}
      />
    </header>
  );
}

// Enter inserts, except on a button or inside the microphone picker, which use Enter themselves.
function insertsOnEnter(event: KeyboardEvent) {
  if (event.key !== 'Enter' || event.target instanceof HTMLButtonElement) return false;
  return !(event.target as HTMLElement).closest('[role="combobox"], [role="listbox"]');
}

/**
 * Records the microphone until Done or Enter inserts the words, or Esc or Cancel drops them.
 * @param onDone the whole take's text, from a final Whisper pass
 */
export function DictationModal({
  onCancel,
  onDone,
}: {
  onCancel: () => void;
  onDone: (text: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const done = useRef<HTMLButtonElement>(null);
  const [deviceId, setDeviceId] = useState('default');
  const [finishing, setFinishing] = useState(false);
  const elapsed = useElapsed();
  const { level, stop, devices, text, error } = useTake(deviceId);

  useEffect(() => {
    dialog.current?.showModal();
    done.current?.focus();
  }, []);

  const finish = async () => {
    if (finishing) return;
    setFinishing(true);
    const words = await stop()
      ?.finish()
      .catch(() => text);
    onDone(words || text);
  };

  return (
    <dialog
      ref={dialog}
      className="dictation"
      aria-labelledby="dictation-title"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      onKeyDown={(event) => {
        if (!insertsOnEnter(event)) return;
        event.preventDefault();
        void finish();
      }}
    >
      <DictationHeader
        finishing={finishing}
        elapsed={elapsed}
        deviceId={deviceId}
        devices={devices}
        onDevice={setDeviceId}
      />
      {error && <p className="dictation-notice">{error}</p>}
      <Waveform read={() => level.current} />
      <p className={text ? 'dictation-text' : 'dictation-text muted'} aria-live="polite">
        {text || 'Start speaking… the words appear every few seconds.'}
      </p>
      <footer className="dictation-footer">
        <span>Typing is paused while recording. Audio stays on this computer.</span>
        <button type="button" className="secondary-button" onClick={onCancel}>
          Cancel
        </button>
        <button
          ref={done}
          type="button"
          className="primary-button dictation-done"
          disabled={finishing}
          onClick={() => void finish()}
        >
          <span className="stop-square" aria-hidden="true" /> Done
        </button>
      </footer>
    </dialog>
  );
}
