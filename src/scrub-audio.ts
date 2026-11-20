import { FPS, audible, gainFactor, type Clip, type Track, type TrackDef } from './timeline-model';
import type { Asset } from './media';

/** One sounding source at a paused playhead: the clip, its asset, where from, at what mix gain. */
export type Slice = { clip: string; url: string; name: string; at: number; gain: number };

/** How long one scrub slice sounds, and how often a held drag may restart one. */
export const SLICE_MS = 90;
export const RESTART_MS = 70;

/**
 * The playback mix at `frame`, mirrored from Composition: only clips on audio tracks sound, each at
 * its track's gain times the clip's gain times the whole-recording gain, a muted track is silent,
 * and any solo narrows the mix to the solo tracks.
 * @param master The whole-recording gain in dB; 0 leaves the mix untouched.
 */
export function mixAt(
  frame: number,
  clips: Clip[],
  tracks: TrackDef[],
  muted: Track[],
  assets: Asset[],
  master = 0,
  solo: Track[] = [],
): Slice[] {
  const factor = gainFactor(master);
  const gains = new Map(
    tracks.flatMap((track) =>
      track.kind === 'audio' ? [[track.id, track.gain * factor] as const] : [],
    ),
  );
  return clips.flatMap((clip) => {
    const gain = gains.get(clip.track); // → number | undefined
    if (gain === undefined || !audible(clip.track, muted, solo)) return [];
    if (frame < clip.start || frame >= clip.start + clip.duration) return [];
    const asset = assets.find((a) => a.id === clip.assetId); // → Asset | undefined
    if (!asset?.hasAudio) return [];
    return [
      {
        clip: clip.id,
        url: asset.url,
        name: asset.name,
        at: (clip.offset + frame - clip.start) / FPS,
        gain: gain * gainFactor(clip.gain),
      },
    ];
  });
}

type Entry = {
  element: HTMLAudioElement;
  gain: GainNode;
  lastStart: number;
  restart?: ReturnType<typeof setTimeout>;
  stop?: ReturnType<typeof setTimeout>;
  pending?: Slice;
};

// The one editor on the page owns the one slice pool: a shared context and one pooled element per
// clip, streaming from the asset's object URL - nothing is decoded ahead - each through a GainNode,
// so monitoring matches the playback mix, amplification above 1 included.
// ponytail: pooled elements live for the session, one per scrubbed clip; evict on clip removal if
// long sessions with heavy cutting ever matter.
let context: AudioContext | undefined;
const pool = new Map<string, Entry>();

function quiet(entry: Entry) {
  clearTimeout(entry.restart);
  clearTimeout(entry.stop);
  entry.restart = entry.stop = entry.pending = undefined;
  entry.element.pause();
}

function start(entry: Entry, slice: Slice) {
  entry.pending = undefined;
  entry.lastStart = performance.now();
  entry.gain.gain.value = slice.gain;
  entry.element.currentTime = slice.at;
  // A rapid restart can interrupt an earlier play(); an aborted one is no error.
  void entry.element.play().catch(() => {});
  clearTimeout(entry.stop);
  entry.stop = setTimeout(() => entry.element.pause(), SLICE_MS);
}

function pooled(slice: Slice): Entry {
  const held = pool.get(slice.clip); // → Entry | undefined
  if (held) return held;
  context ??= new AudioContext();
  if (context.state === 'suspended') void context.resume();
  const element = document.createElement('audio');
  element.src = slice.url;
  element.dataset.testid = 'scrub-slice';
  element.dataset.asset = slice.name;
  element.style.display = 'none';
  const gain = context.createGain();
  context.createMediaElementSource(element).connect(gain).connect(context.destination);
  document.body.append(element);
  const entry: Entry = { element, gain, lastStart: -Infinity };
  pool.set(slice.clip, entry);
  return entry;
}

/** Sound each slice now or once the restart throttle allows; silence everything not listed. */
export function playSlices(slices: Slice[]) {
  if (context?.state === 'suspended') void context.resume();
  const live = new Set(slices.map((slice) => slice.clip)); // → Set<string>
  for (const [clip, entry] of pool) if (!live.has(clip)) quiet(entry);
  for (const slice of slices) {
    const entry = pooled(slice); // → Entry
    const wait = RESTART_MS - (performance.now() - entry.lastStart);
    if (wait <= 0) start(entry, slice);
    else {
      // Throttled: play the latest position once the throttle opens, so the resting frame sounds.
      entry.pending = slice;
      entry.restart ??= setTimeout(() => {
        entry.restart = undefined;
        if (entry.pending) start(entry, entry.pending);
      }, wait);
    }
  }
}

/** Pause every slice, pending restarts included. Playback starting calls this. */
export function stopSlices() {
  for (const entry of pool.values()) quiet(entry);
}
