// A timeline clip an agent can read and edit through ui-sdk's bridge (CLIP-49). The primitive only
// names times: each action hands a timeline frame to the editor, which runs the same model
// functions and undo path as the [ and ] keys and the Razor.
import { createContext, useContext } from 'react';
import { definePrimitive } from '@ui-sdk/core';
import { usePart, usePrimitive, type PartProps } from '@ui-sdk/react/primitive';
import { FPS } from './timeline-model';

/** What an agent asks of a clip, in timeline frames; the editor answers whether it took. */
export type ClipEdit = (
  id: string,
  edit: 'trimStart' | 'trimEnd' | 'split',
  frame: number,
) => boolean;

type Options = {
  clipId: string;
  track: string;
  /** Timeline start, length and source offset, in frames. */
  start: number;
  duration: number;
  offset: number;
  onEdit: ClipEdit;
};

/** The editor's answer to agent edits, provided around the timeline; without it, they change nothing. */
export const ClipEditContext = createContext<ClipEdit>(() => false);

const seconds = (frames: number) => Math.round((frames / FPS) * 1000) / 1000;

// An agent's time in seconds → a timeline frame; text like "12.5" is taken, anything else refused.
function frameOf(time: unknown): number {
  const value = typeof time === 'string' ? Number.parseFloat(time) : time;
  if (typeof value !== 'number' || !Number.isFinite(value))
    throw new Error(`Expected a time in seconds, got ${JSON.stringify(time)}.`);
  return Math.round(value * FPS);
}

/** A clip's agent surface: its place in seconds, and trims and a cut at a timeline time. */
const clip = definePrimitive({
  name: 'clip',
  options: {
    clipId: 'string',
    track: 'string',
    start: 'number',
    duration: 'number',
    offset: 'number',
    onEdit: 'callback',
  },
  controlled: ['track', 'start', 'end', 'sourceStart'],
  state: (options: Options) => ({
    track: options.track,
    start: seconds(options.start),
    end: seconds(options.start + options.duration),
    sourceStart: seconds(options.offset),
  }),
  sync: (options: Options) => ({
    track: options.track,
    start: seconds(options.start),
    end: seconds(options.start + options.duration),
    sourceStart: seconds(options.offset),
  }),
  api: (context) => {
    const run = (edit: 'trimStart' | 'trimEnd' | 'split', time: unknown) => {
      const { clipId, onEdit } = context.options();
      const at = frameOf(time); // → timeline frame
      if (!onEdit(clipId, edit, at))
        throw new Error(
          `Nothing changed: ${seconds(at)} s is not inside this clip, or its track is locked.`,
        );
    };
    return {
      /** Move the clip's start later, to a timeline time in seconds inside the clip. */
      trimStart: (time: number) => run('trimStart', time),
      /** Move the clip's end earlier, to a timeline time in seconds inside the clip. */
      trimEnd: (time: number) => run('trimEnd', time),
      /** Cut the clip in two at a timeline time in seconds inside it. */
      split: (time: number) => run('split', time),
    };
  },
  slots: (slot) => ({ root: slot({}) }),
  agent: { actions: ['trimStart', 'trimEnd', 'split'] },
});

/**
 * The timeline's clip button with the clip primitive on it, so the agent bridge lists the clip by
 * the button's name. Its edits go to the nearest ClipEditContext.
 * Every other prop and handler reaches the button unchanged.
 */
export function AgentClip({
  clipId,
  track,
  start,
  duration,
  offset,
  ...props
}: Omit<Options, 'onEdit'> & PartProps<'button'>) {
  const onEdit = useContext(ClipEditContext);
  const handle = usePrimitive(clip, {
    clipId,
    track,
    start,
    duration,
    offset,
    onEdit,
  });
  return usePart(handle, 'root', {}, props, 'button');
}
