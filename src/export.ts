import {
  ALL_FORMATS,
  AudioBufferSink,
  AudioBufferSource,
  BlobSource,
  BufferTarget,
  CanvasSink,
  CanvasSource,
  Input,
  MovOutputFormat,
  Mp4OutputFormat,
  Output,
  WebMOutputFormat,
  canEncodeAudio,
  canEncodeVideo,
  type InputAudioTrack,
} from 'mediabunny';
import { openMedia, type Asset } from './media';
import {
  DEFAULT_FILL,
  DEFAULT_GRADIENT,
  STAGE,
  cameraTransform,
  clipRect,
  cropPosition,
  gradientLine,
  maskRect,
  panelShadow,
  type Layout,
  type Rect,
} from './stage';
import {
  DEFAULT_TRACKS,
  FPS,
  covers,
  gainFactor,
  outputFrames,
  outputRate,
  outputTick,
  paintOrder,
  sourceFrame,
  timecode,
  type Clip,
  type OutputFps,
  type Track,
  type TrackDef,
  type VisualRole,
  type Zoom,
} from './timeline-model';
import { cursorDrawing, decodeCursorImages } from './cursor-render';
import { prepareFraming, framingAt } from './framing';

export type RenderVideoOptions = {
  clips: Clip[];
  assets: Asset[];
  zooms: Zoom[];
  layout: Layout;
  /** The ordered registry: visual tracks paint back to front, audio tracks mix at their gains.
   * Omitted, it is the four legacy tracks, as a v2 or v3 project reads. */
  tracks?: TrackDef[];
  muted: Track[];
  width: 1920 | 3840;
  /** Explicit container, with no substitution. Omit for automatic MP4/WebM negotiation.
   * MOV uses AVC and uncompressed 16-bit PCM audio (about 11.5 MB/minute at stereo 48 kHz).
   */
  format?: 'mp4' | 'mov' | 'webm';
  /** Output rate; Auto, the default, is the 30 fps project cadence. The edit grid never changes. */
  fps?: OutputFps;
  /** The whole-recording gain in dB, matching the preview mix. Omit for unity. */
  gain?: number;
  onProgress: (progress: number) => void;
  signal?: AbortSignal;
};

// Capability queries do not start the worker. Qualify AAC before reading project media.
async function prepareAac(signal?: AbortSignal): Promise<void> {
  const options = { sampleRate: 48000, numberOfChannels: 2, bitrate: 128000 };
  signal?.throwIfAborted();
  const output = new Output({ target: new BufferTarget(), format: new Mp4OutputFormat() });
  try {
    if (!(await canEncodeAudio('aac', options))) {
      const { registerAacEncoder } = await import('@mediabunny/aac-encoder');
      registerAacEncoder();
    }
    signal?.throwIfAborted();
    const audio = new AudioBufferSource({ codec: 'aac', ...options });
    output.addAudioTrack(audio);
    await output.start();
    await audio.add(new AudioBuffer({ length: 2048, ...options }));
    audio.close();
    await output.finalize();
    signal?.throwIfAborted();
  } catch (error) {
    signal?.throwIfAborted();
    throw new Error(
      'MP4 AAC audio could not initialize locally. Allow local encoder workers, reload and retry, or choose MOV or WebM. ' +
        (error instanceof Error ? error.message : String(error)),
      { cause: error },
    );
  } finally {
    if (output.state !== 'finalized') await output.cancel();
  }
}

// One clip's decoded audio as a single buffer whose first frame is the clip's source in-point.
// Decoders hand back a buffer per packet, about 50 a second; one audio node per packet made the
// mix quadratic in timeline length, so the packets are joined and each clip gets one node.
async function clipAudio(
  mixer: OfflineAudioContext,
  track: InputAudioTrack,
  clip: Clip,
  check: () => void,
): Promise<AudioBuffer | undefined> {
  const start = clip.offset / FPS; // → source seconds
  const end = start + clip.duration / FPS;
  let joined: AudioBuffer | undefined;
  for await (const { buffer, timestamp } of new AudioBufferSink(track).buffers(start, end)) {
    check();
    const rate = buffer.sampleRate;
    joined ??= mixer.createBuffer(buffer.numberOfChannels, Math.ceil((end - start) * rate), rate);
    const at = Math.round((timestamp - start) * rate); // → frame in joined; negative before the trim
    if (at >= joined.length) continue;
    for (let channel = 0; channel < joined.numberOfChannels; channel++)
      joined.copyToChannel(
        buffer.getChannelData(channel).subarray(Math.max(0, -at)),
        channel,
        Math.max(0, at),
      );
  }
  return joined;
}

// The offline mix preserves resampling, source trims, overlapping clips and track gains.
// ponytail: every clip's PCM and the whole mix are in memory at once, about 23 MB per stereo
// minute each. Render in fixed windows and add each to the encoder if long exports run out.
async function mixAudio(
  inputs: Map<string, Input>,
  clips: Clip[],
  gains: Map<Track, number>,
  frames: number,
  check: () => void,
): Promise<AudioBuffer> {
  const mixer = new OfflineAudioContext(2, Math.ceil((frames / FPS) * 48000), 48000);
  for (const clip of clips) {
    const track = await inputs.get(clip.assetId)!.getPrimaryAudioTrack();
    if (!track || !(await track.canDecode()))
      throw new Error(`Cannot decode audio in clip ${clip.id}.`);
    const joined = await clipAudio(mixer, track, clip, check);
    if (!joined) continue;
    const source = mixer.createBufferSource();
    source.buffer = joined;
    const gain = mixer.createGain();
    gain.gain.value = (gains.get(clip.track) ?? 1) * gainFactor(clip.gain);
    source.connect(gain).connect(mixer.destination);
    source.start(clip.start / FPS);
  }
  return mixer.startRendering();
}

const isVisual = (tracks: TrackDef[], clip: Clip) =>
  tracks.some((t) => t.id === clip.track && t.kind === 'visual');

// A decoded picture for one video track at the frame being drawn.
// A decoded picture with the sizing of the clip it came from, never looked up by source.
type Layer = {
  track: Track;
  image: HTMLCanvasElement | OffscreenCanvas | ImageBitmap;
  sizing: Pick<Clip, 'fit' | 'scale'>;
};

// Paint one composition frame in stage pixels: backdrop, then each visual track back to front in
// its role's rect, crop and zoom. Anything that must move with the screen, such as a recorded
// cursor, is drawn inside its clip.
// The stage behind the panels: the layout's colour or gradient over the whole stage.
function paintBackdrop(context: CanvasRenderingContext2D, layout: Layout): void {
  const { fill = DEFAULT_FILL, fillTo, fillAngle = DEFAULT_GRADIENT.angle } = layout;
  if (fillTo === undefined) context.fillStyle = fill;
  else {
    const { x0, y0, x1, y1 } = gradientLine(fillAngle, STAGE);
    const gradient = context.createLinearGradient(x0, y0, x1, y1);
    gradient.addColorStop(0, fill);
    gradient.addColorStop(1, fillTo);
    context.fillStyle = gradient;
  }
  context.fillRect(0, 0, STAGE.width, STAGE.height);
}

// A panel's drop shadow, only outside its rounded box as CSS `box-shadow` has it. Canvas shadow
// sizes ignore the transform, so they take the render scale.
function paintShadow(
  context: CanvasRenderingContext2D,
  role: VisualRole,
  mask: Rect,
  layout: Layout,
): void {
  const scale = context.getTransform().a; // → render pixels per stage pixel
  const shadow = role === 'background' ? undefined : panelShadow(layout.shadow, scale);
  if (!shadow) return;
  const radius = Math.max(0, layout.radius);
  context.save();
  context.beginPath();
  context.rect(0, 0, STAGE.width, STAGE.height);
  context.roundRect(mask.x, mask.y, mask.width, mask.height, radius);
  context.clip('evenodd');
  context.beginPath();
  context.roundRect(mask.x, mask.y, mask.width, mask.height, radius);
  context.shadowColor = shadow.color;
  context.shadowBlur = shadow.blur;
  context.shadowOffsetY = shadow.offsetY;
  context.fillStyle = '#000';
  context.fill();
  context.restore();
}

function drawFrame(
  context: CanvasRenderingContext2D,
  layout: Layout,
  tracks: TrackDef[],
  camera: { scale: number; x: number; y: number },
  layers: Layer[],
  cursor: ReturnType<typeof cursorDrawing>,
): void {
  paintBackdrop(context, layout);
  for (const { id, role, placeholder } of paintOrder(tracks, layout.mode === 'pip')) {
    const mask = maskRect(role, layout); // → stage rect
    paintShadow(context, role, mask, layout);
    context.save();
    context.beginPath();
    const radius = role === 'background' ? 0 : Math.max(0, layout.radius);
    context.roundRect(mask.x, mask.y, mask.width, mask.height, radius);
    context.clip();
    if (placeholder) {
      context.fillStyle = '#10181b';
      context.fillRect(mask.x, mask.y, mask.width, mask.height);
    }
    const view = cameraTransform(mask, role === 'screen' ? camera : undefined); // → affine
    context.translate(view.x, view.y);
    context.scale(view.scale, view.scale);
    for (const layer of layers) {
      if (layer.track !== id) continue;
      const cover = clipRect(mask, layer.image, cropPosition(role, layout), layer.sizing); // → local rect
      context.drawImage(layer.image, cover.x, cover.y, cover.width, cover.height);
    }
    if (cursor?.track === id) {
      context.save();
      context.translate(cursor.x + cursor.hotspotX, cursor.y + cursor.hotspotY);
      context.rotate((cursor.rotation * Math.PI) / 180);
      context.drawImage(
        cursor.image,
        -cursor.hotspotX,
        -cursor.hotspotY,
        cursor.width,
        cursor.height,
      );
      context.restore();
    }
    context.restore();
  }
}

// Open every clip's local media once, keyed by asset, so decoding never touches a stale URL.
async function openInputs(
  inputs: Map<string, Input>,
  images: Map<string, ImageBitmap>,
  clips: Clip[],
  assets: Asset[],
  check: () => void,
  signal?: AbortSignal,
): Promise<void> {
  for (const clip of clips) {
    if (inputs.has(clip.assetId) || images.has(clip.assetId)) continue;
    const asset = assets.find((item) => item.id === clip.assetId);
    if (!asset) throw new Error(`Missing media for clip ${clip.id}.`);
    if (!asset.url.startsWith('blob:'))
      throw new Error(`Re-import ${asset.name}: export requires local blob media.`);
    const response = await openMedia(asset, signal);
    if (asset.kind === 'image') {
      images.set(asset.id, await createImageBitmap(await response.blob()));
    } else
      inputs.set(
        asset.id,
        new Input({ source: new BlobSource(await response.blob()), formats: ALL_FORMATS }),
      );
    check();
  }
}

export type RenderFrameImageOptions = Pick<
  RenderVideoOptions,
  'clips' | 'assets' | 'zooms' | 'layout' | 'tracks' | 'width' | 'signal'
> & { frame: number };

// Validate a timed visual once before asking its decoder for frames. `first` is where its first
// sample starts: asked for anything earlier, the decoder returns nothing, so requests clamp to it
// and the first frame is held, as the preview shows.
async function videoSink(inputs: Map<string, Input>, clip: Clip, poolSize?: number) {
  const track = await inputs.get(clip.assetId)!.getPrimaryVideoTrack();
  if (!track || !(await track.canDecode()))
    throw new Error(`Cannot decode video in clip ${clip.id}.`);
  return { sink: new CanvasSink(track, { poolSize }), first: await track.getFirstTimestamp() };
}

type Frames = AsyncGenerator<Awaited<ReturnType<CanvasSink['getCanvas']>>, void, unknown>;

// A frame the decoder cannot produce fails the render, never a held or blank picture that would
// hide the corruption. The message names the media and the timeline time to find it.
const undecodable = (assets: Asset[], clip: Clip, frame: number, cause: unknown) =>
  new Error(
    `"${assets.find((asset) => asset.id === clip.assetId)?.name}" could not be decoded at ${timecode(frame)}.`,
    { cause },
  );

// The picture a clip shows at a composition frame: a still, or the decoded video frame at or
// before its source time (the last one past the stream's end, the first one before its start).
async function clipImage(
  inputs: Map<string, Input>,
  images: Map<string, ImageBitmap>,
  assets: Asset[],
  clip: Clip,
  frame: number,
): Promise<Layer['image'] | undefined> {
  const still = images.get(clip.assetId);
  if (still) return still;
  const { sink, first } = await videoSink(inputs, clip);
  try {
    return (await sink.getCanvas(Math.max(first, sourceFrame(clip, frame) / FPS)))?.canvas;
  } catch (error) {
    throw undecodable(assets, clip, frame, error);
  }
}

// The next decoded canvas of a clip's frame iterator, drawn at timeline `frame`.
async function nextCanvas(frames: Frames, assets: Asset[], clip: Clip, frame: number) {
  try {
    return (await frames.next()).value; // → decoded canvas, reused two frames later
  } catch (error) {
    throw undecodable(assets, clip, frame, error);
  }
}

/**
 * Render one composition frame as a PNG through the same drawFrame, framing and cursor path as
 * the video export. No encoder runs. Throws when the frame is outside the timeline.
 */
export async function renderFrameImage({
  clips,
  assets,
  zooms,
  layout,
  tracks = DEFAULT_TRACKS,
  frame,
  width,
  signal,
}: RenderFrameImageOptions): Promise<Blob> {
  const check = () => signal?.throwIfAborted();
  check();
  if (width !== 1920 && width !== 3840) throw new Error('Image width must be 1920 or 3840.');
  const frames = Math.max(0, ...clips.map((clip) => clip.start + clip.duration));
  if (frames <= 0) throw new Error('Add clips before copying a frame.');
  if (!Number.isInteger(frame) || frame < 0 || frame >= frames)
    throw new Error('That frame is outside the timeline.');
  const height = (width * 9) / 16;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas rendering is unavailable in this browser.');
  const inputs = new Map<string, Input>();
  const images = new Map<string, ImageBitmap>();
  try {
    const visible = clips.filter((clip) => isVisual(tracks, clip) && covers(clip, frame));
    const cursorImages = await decodeCursorImages(assets);
    await openInputs(inputs, images, visible, assets, check, signal);
    const layers: Layer[] = [];
    for (const clip of visible) {
      const image = await clipImage(inputs, images, assets, clip, frame);
      check();
      if (image) layers.push({ track: clip.track, image, sizing: clip });
    }
    context.setTransform(width / STAGE.width, 0, 0, height / STAGE.height, 0, 0);
    const paths = prepareFraming(zooms, clips, assets, layout, tracks);
    drawFrame(
      context,
      layout,
      tracks,
      framingAt(zooms, paths, frame),
      layers,
      cursorDrawing(clips, assets, frame, layout, cursorImages, tracks),
    );
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('The browser could not encode the frame as PNG.');
    return blob;
  } finally {
    for (const image of images.values()) image.close();
    for (const input of inputs.values()) input.dispose();
    canvas.width = 0;
    canvas.height = 0;
  }
}

// Where output sample `index` starts and how long it shows, in seconds, cut at the timeline end.
// WebM keeps 1 ms timestamps, so both ends round to the millisecond and a sample that rounds to
// nothing is skipped: endpoints move by at most 0.5 ms, and errors never accumulate.
function sampleSpan(index: number, rate: { p: number; q: number }, end: number, webm: boolean) {
  const at = (n: number) => Math.min((n * rate.q) / rate.p, end); // → seconds
  const round = (seconds: number) => (webm ? Math.round(seconds * 1000) / 1000 : seconds);
  const start = round(at(index));
  return { start, duration: round(at(index + 1)) - start };
}

/** Render and encode locally at the chosen output rate. The Blob MIME identifies the actual
 * container.
 * @throws When the selected codecs are unavailable, media cannot decode, or encoding fails.
 * @throws {DOMException} When the abort signal is cancelled.
 */
export async function renderVideo({
  clips,
  assets,
  zooms,
  layout,
  tracks = DEFAULT_TRACKS,
  muted,
  width,
  format,
  fps = 'auto',
  gain = 0,
  onProgress,
  signal,
}: RenderVideoOptions): Promise<Blob> {
  const check = () => signal?.throwIfAborted();
  check();
  if (width !== 1920 && width !== 3840) throw new Error('Export width must be 1920 or 3840.');
  const frames = Math.max(0, ...clips.map((clip) => clip.start + clip.duration));
  if (!Number.isInteger(frames) || frames <= 0) throw new Error('Add clips before exporting.');
  const height = (width * 9) / 16;
  const rate = outputRate(fps); // → exact p/q
  const samples = outputFrames(frames, rate);
  const master = gainFactor(gain);
  const gains = new Map(
    tracks.flatMap((t) => (t.kind === 'audio' ? [[t.id, t.gain * master]] : [])),
  );
  const audioClips = clips.filter(
    (clip) =>
      gains.has(clip.track) &&
      !muted.includes(clip.track) &&
      assets.some((asset) => asset.id === clip.assetId && asset.hasAudio),
  );
  onProgress(0);
  const videoOptions = {
    width,
    height,
    frameRate: rate.p / rate.q,
    bitrate: width === 3840 ? 24_000_000 : 8_000_000,
  };
  const audioOptions = { sampleRate: 48000, numberOfChannels: 2, bitrate: 128000 };
  const selected =
    format ??
    ((await canEncodeVideo('avc', videoOptions)) &&
    (!audioClips.length || (await canEncodeAudio('aac', audioOptions)))
      ? 'mp4'
      : 'webm');
  const profiles = {
    mp4: { container: new Mp4OutputFormat(), video: 'avc', audio: 'aac' },
    mov: { container: new MovOutputFormat(), video: 'avc', audio: 'pcm-s16' },
    webm: { container: new WebMOutputFormat(), video: 'vp9', audio: 'opus' },
  } as const;
  const profile = profiles[selected];
  const videoSupported = await canEncodeVideo(profile.video, videoOptions);
  if (videoSupported && selected === 'mp4' && audioClips.length) await prepareAac(signal);
  const audioSupported = !audioClips.length || (await canEncodeAudio(profile.audio, audioOptions));
  check();
  if (!videoSupported) {
    throw new Error(
      `This browser cannot encode ${selected.toUpperCase()} ${profile.video.toUpperCase()} at ${width}×${height}. Try a smaller resolution, another format, or a browser with this encoder.`,
    );
  }
  if (!audioSupported) {
    throw new Error(
      `This browser cannot encode ${selected.toUpperCase()} ${profile.audio.toUpperCase()} audio. Choose MOV (uncompressed audio, larger files) or WebM, or use a browser with this audio encoder. Audio has not been removed.`,
    );
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas rendering is unavailable in this browser.');
  const target = new BufferTarget();
  const output = new Output({
    target,
    format: profile.container,
  });
  const video = new CanvasSource(canvas, { codec: profile.video, ...videoOptions });
  const audio = audioClips.length
    ? new AudioBufferSource({ codec: profile.audio, ...audioOptions })
    : undefined;
  // Only MP4/MOV at 29.97 take the rate hint: its 1/30000 timebase is exact there, while the
  // default timebase is exact for every whole rate and WebM keeps 1 ms whatever the hint says.
  output.addVideoTrack(
    video,
    rate.q !== 1 && selected !== 'webm' ? { frameRate: rate.p / rate.q } : {},
  );
  if (audio) output.addAudioTrack(audio);
  const inputs = new Map<string, Input>();
  const images = new Map<string, ImageBitmap>();
  const iterators: Frames[] = [];
  try {
    const cursorImages = await decodeCursorImages(assets);
    await openInputs(inputs, images, clips, assets, check, signal);
    const mixed = audio && (await mixAudio(inputs, audioClips, gains, frames, check));
    check();
    const visuals = [];
    for (const clip of clips.filter((clip) => isVisual(tracks, clip))) {
      const image = images.get(clip.assetId);
      if (image) {
        visuals.push({ kind: 'image' as const, clip, image });
        continue;
      }
      const { sink, first } = await videoSink(inputs, clip, 2);
      // The source time of every output sample the clip is live for, made as the encoder asks.
      const times = function* () {
        const last = outputFrames(clip.start + clip.duration, rate);
        for (let n = outputFrames(clip.start, rate); n < last; n++)
          yield Math.max(first, sourceFrame(clip, outputTick(n, rate)) / FPS);
      };
      // Each canvas is drawn before the next is requested, so two pooled canvases never collide.
      const iterator = sink.canvasesAtTimestamps(times());
      iterators.push(iterator);
      visuals.push({ kind: 'video' as const, clip, iterator });
    }
    await output.start();
    onProgress(0.1);
    if (audio && mixed) {
      await audio.add(mixed);
      audio.close();
    }
    context.setTransform(width / STAGE.width, 0, 0, height / STAGE.height, 0, 0);
    const paths = prepareFraming(zooms, clips, assets, layout, tracks);
    for (let index = 0; index < samples; index++) {
      check();
      const frame = outputTick(index, rate); // → fractional composition tick
      const layers: Layer[] = [];
      for (const visual of visuals) {
        const { clip } = visual;
        if (!covers(clip, frame)) continue;
        if (visual.kind === 'image') {
          layers.push({ track: clip.track, image: visual.image, sizing: clip });
          continue;
        }
        const sample = await nextCanvas(visual.iterator, assets, clip, frame);
        check();
        if (sample) layers.push({ track: clip.track, image: sample.canvas, sizing: clip });
      }
      drawFrame(
        context,
        layout,
        tracks,
        framingAt(zooms, paths, frame),
        layers,
        cursorDrawing(clips, assets, frame, layout, cursorImages, tracks),
      );
      const span = sampleSpan(index, rate, frames / FPS, selected === 'webm');
      if (span.duration > 0) await video.add(span.start, span.duration);
      onProgress(0.1 + (0.85 * (index + 1)) / samples);
    }
    video.close();
    check();
    await output.finalize();
    check();
    if (!target.buffer) throw new Error('The encoder produced no video data.');
    onProgress(1);
    return new Blob([target.buffer], { type: output.format.mimeType });
  } catch (error) {
    if (output.state !== 'finalized' && output.state !== 'canceled') await output.cancel();
    check();
    throw new Error(
      `Video export failed: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  } finally {
    for (const image of images.values()) image.close();
    await Promise.all(iterators.map((iterator) => iterator.return()));
    for (const input of inputs.values()) input.dispose();
    canvas.width = 0;
    canvas.height = 0;
  }
}
