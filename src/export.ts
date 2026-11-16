import {
  ALL_FORMATS,
  AudioBufferSink,
  AudioBufferSource,
  BlobSource,
  BufferTarget,
  CanvasSink,
  CanvasSource,
  Input,
  Mp4OutputFormat,
  Output,
  WebMOutputFormat,
  canEncodeAudio,
  canEncodeVideo,
  type InputAudioTrack,
} from 'mediabunny';
import { openMedia, type Asset } from './media';
import { cameraTransform, coverRect, cropPosition, maskRect, STAGE, type Layout } from './stage';
import {
  FPS,
  MUSIC_GAIN,
  covers,
  sourceFrame,
  type Clip,
  type Track,
  type Zoom,
} from './timeline-model';
import { cursorDrawing, decodeCursorImages } from './cursor-render';
import { prepareFraming, framingAt } from './framing';

export type RenderVideoOptions = {
  clips: Clip[];
  assets: Asset[];
  zooms: Zoom[];
  layout: Layout;
  muted: Track[];
  width: 1920 | 3840;
  onProgress: (progress: number) => void;
  signal?: AbortSignal;
};

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
    gain.gain.value = clip.track === 'music' ? MUSIC_GAIN : 1;
    source.connect(gain).connect(mixer.destination);
    source.start(clip.start / FPS);
  }
  return mixer.startRendering();
}

// A decoded picture for one video track at the frame being drawn.
type Layer = { track: Track; image: HTMLCanvasElement | OffscreenCanvas };

// Paint one composition frame in stage pixels: backdrop, then each track's mask, crop and zoom.
// Anything that must move with the screen, such as a recorded cursor, is drawn inside its clip.
function drawFrame(
  context: CanvasRenderingContext2D,
  layout: Layout,
  camera: { scale: number; x: number; y: number },
  layers: Layer[],
  cursor: ReturnType<typeof cursorDrawing>,
): void {
  context.fillStyle = '#172324';
  context.fillRect(0, 0, STAGE.width, STAGE.height);
  for (const track of ['screen', 'camera'] as const) {
    const mask = maskRect(track, layout); // → stage rect
    context.save();
    context.beginPath();
    context.roundRect(mask.x, mask.y, mask.width, mask.height, Math.max(0, layout.radius));
    context.clip();
    context.fillStyle = '#10181b';
    context.fillRect(mask.x, mask.y, mask.width, mask.height);
    const view = cameraTransform(mask, track === 'screen' ? camera : undefined); // → affine
    context.translate(view.x, view.y);
    context.scale(view.scale, view.scale);
    for (const layer of layers) {
      if (layer.track !== track) continue;
      const cover = coverRect(mask, layer.image, cropPosition(track, layout)); // → local rect
      context.drawImage(layer.image, cover.x, cover.y, cover.width, cover.height);
    }
    if (track === 'screen' && cursor) {
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
  clips: Clip[],
  assets: Asset[],
  check: () => void,
  signal?: AbortSignal,
): Promise<void> {
  for (const clip of clips) {
    if (inputs.has(clip.assetId)) continue;
    const asset = assets.find((item) => item.id === clip.assetId);
    if (!asset) throw new Error(`Missing media for clip ${clip.id}.`);
    if (!asset.url.startsWith('blob:'))
      throw new Error(`Re-import ${asset.name}: export requires local blob media.`);
    const response = await openMedia(asset, signal);
    inputs.set(
      asset.id,
      new Input({ source: new BlobSource(await response.blob()), formats: ALL_FORMATS }),
    );
    check();
  }
}

export type RenderFrameImageOptions = Pick<
  RenderVideoOptions,
  'clips' | 'assets' | 'zooms' | 'layout' | 'width' | 'signal'
> & { frame: number };

/**
 * Render one composition frame as a PNG through the same drawFrame, framing and cursor path as
 * the video export. No encoder runs. Throws when the frame is outside the timeline.
 */
export async function renderFrameImage({
  clips,
  assets,
  zooms,
  layout,
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
  try {
    const visible = clips.filter(
      (clip) => (clip.track === 'screen' || clip.track === 'camera') && covers(clip, frame),
    );
    const cursorImages = await decodeCursorImages(assets);
    await openInputs(inputs, visible, assets, check, signal);
    const layers: Layer[] = [];
    for (const clip of visible) {
      const track = await inputs.get(clip.assetId)!.getPrimaryVideoTrack();
      if (!track || !(await track.canDecode()))
        throw new Error(`Cannot decode video in clip ${clip.id}.`);
      const sample = await new CanvasSink(track).getCanvas(sourceFrame(clip, frame) / FPS);
      check();
      if (sample) layers.push({ track: clip.track, image: sample.canvas });
    }
    context.setTransform(width / STAGE.width, 0, 0, height / STAGE.height, 0, 0);
    const paths = prepareFraming(zooms, clips, assets, layout);
    drawFrame(
      context,
      layout,
      framingAt(zooms, paths, frame),
      layers,
      cursorDrawing(clips, assets, frame, layout, cursorImages),
    );
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('The browser could not encode the frame as PNG.');
    return blob;
  } finally {
    for (const input of inputs.values()) input.dispose();
    canvas.width = 0;
    canvas.height = 0;
  }
}

/** Render and encode locally at 30fps. The Blob MIME identifies the negotiated container. */
export async function renderVideo({
  clips,
  assets,
  zooms,
  layout,
  muted,
  width,
  onProgress,
  signal,
}: RenderVideoOptions): Promise<Blob> {
  const check = () => signal?.throwIfAborted();
  check();
  if (width !== 1920 && width !== 3840) throw new Error('Export width must be 1920 or 3840.');
  const frames = Math.max(0, ...clips.map((clip) => clip.start + clip.duration));
  if (!Number.isInteger(frames) || frames <= 0) throw new Error('Add clips before exporting.');
  const height = (width * 9) / 16;
  const audioClips = clips.filter(
    (clip) =>
      (clip.track === 'voice' || clip.track === 'music') &&
      !muted.includes(clip.track) &&
      assets.some((asset) => asset.id === clip.assetId && asset.hasAudio),
  );
  onProgress(0);
  const videoOptions = {
    width,
    height,
    frameRate: FPS,
    bitrate: width === 3840 ? 24_000_000 : 8_000_000,
  };
  const audioOptions = { sampleRate: 48000, numberOfChannels: 2, bitrate: 128000 };
  const mp4 =
    (await canEncodeVideo('avc', videoOptions)) &&
    (!audioClips.length || (await canEncodeAudio('aac', audioOptions)));
  if (
    !mp4 &&
    !(
      (await canEncodeVideo('vp9', videoOptions)) &&
      (!audioClips.length || (await canEncodeAudio('opus', audioOptions)))
    )
  ) {
    throw new Error(
      `This browser cannot encode ${width}×${height} video${audioClips.length ? ' with audio' : ''}. Try Chrome with WebCodecs support or a smaller export.`,
    );
  }
  check();
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas rendering is unavailable in this browser.');
  const target = new BufferTarget();
  const output = new Output({
    target,
    format: mp4 ? new Mp4OutputFormat() : new WebMOutputFormat(),
  });
  const video = new CanvasSource(canvas, { codec: mp4 ? 'avc' : 'vp9', ...videoOptions });
  const audio = audioClips.length
    ? new AudioBufferSource({ codec: mp4 ? 'aac' : 'opus', ...audioOptions })
    : undefined;
  output.addVideoTrack(video, { frameRate: FPS });
  if (audio) output.addAudioTrack(audio);
  const inputs = new Map<string, Input>();
  const iterators: AsyncGenerator<Awaited<ReturnType<CanvasSink['getCanvas']>>, void, unknown>[] =
    [];
  try {
    const cursorImages = await decodeCursorImages(assets);
    await openInputs(inputs, clips, assets, check, signal);
    const mixed = audio && (await mixAudio(inputs, audioClips, frames, check));
    check();
    const visuals = [];
    for (const clip of clips.filter((clip) => clip.track === 'screen' || clip.track === 'camera')) {
      const track = await inputs.get(clip.assetId)!.getPrimaryVideoTrack();
      if (!track || !(await track.canDecode()))
        throw new Error(`Cannot decode video in clip ${clip.id}.`);
      const times = Array.from(
        { length: clip.duration },
        (_, index) => sourceFrame(clip, clip.start + index) / FPS,
      );
      // Each canvas is drawn before the next is requested, so two pooled canvases never collide.
      const iterator = new CanvasSink(track, { poolSize: 2 }).canvasesAtTimestamps(times);
      iterators.push(iterator);
      visuals.push({ clip, iterator });
    }
    await output.start();
    onProgress(0.1);
    if (audio && mixed) {
      await audio.add(mixed);
      audio.close();
    }
    context.setTransform(width / STAGE.width, 0, 0, height / STAGE.height, 0, 0);
    const paths = prepareFraming(zooms, clips, assets, layout);
    for (let frame = 0; frame < frames; frame++) {
      check();
      const layers: Layer[] = [];
      for (const { clip, iterator } of visuals) {
        if (!covers(clip, frame)) continue;
        const sample = (await iterator.next()).value; // → decoded canvas, reused two frames later
        check();
        if (sample) layers.push({ track: clip.track, image: sample.canvas });
      }
      drawFrame(
        context,
        layout,
        framingAt(zooms, paths, frame),
        layers,
        cursorDrawing(clips, assets, frame, layout, cursorImages),
      );
      await video.add(frame / FPS, 1 / FPS);
      onProgress(0.1 + (0.85 * (frame + 1)) / frames);
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
    await Promise.all(iterators.map((iterator) => iterator.return()));
    for (const input of inputs.values()) input.dispose();
    canvas.width = 0;
    canvas.height = 0;
  }
}
