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
} from 'mediabunny';
import type { Asset } from './media';
import type { Layout } from './Composition';
import { FPS, covers, sourceFrame, zoomCamera, type Clip, type Track, type Zoom } from './timeline';

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
    for (const clip of clips) {
      if (inputs.has(clip.assetId)) continue;
      const asset = assets.find((item) => item.id === clip.assetId);
      if (!asset) throw new Error(`Missing media for clip ${clip.id}.`);
      if (!asset.url.startsWith('blob:'))
        throw new Error(`Re-import ${asset.name}: export requires local blob media.`);
      const response = await fetch(asset.url, { signal });
      inputs.set(
        asset.id,
        new Input({ source: new BlobSource(await response.blob()), formats: ALL_FORMATS }),
      );
      check();
    }
    let mixed: AudioBuffer | undefined;
    if (audio) {
      // The offline mix preserves resampling, source trims, overlapping clips and track gains.
      const mixer = new OfflineAudioContext(2, Math.ceil((frames / FPS) * 48000), 48000);
      for (const clip of audioClips) {
        const track = await inputs.get(clip.assetId)!.getPrimaryAudioTrack();
        if (!track || !(await track.canDecode()))
          throw new Error(`Cannot decode audio in clip ${clip.id}.`);
        const start = clip.offset / FPS;
        const end = start + clip.duration / FPS;
        for await (const { buffer, timestamp } of new AudioBufferSink(track).buffers(start, end)) {
          check();
          const from = Math.max(start, timestamp);
          const to = Math.min(end, timestamp + buffer.duration);
          if (to <= from) continue;
          const source = mixer.createBufferSource();
          source.buffer = buffer;
          const gain = mixer.createGain();
          gain.gain.value = clip.track === 'music' ? 0.22 : 1;
          source.connect(gain).connect(mixer.destination);
          source.start(clip.start / FPS + from - start, from - timestamp, to - from);
        }
      }
      mixed = await mixer.startRendering();
      check();
    }
    const visuals = [];
    for (const clip of clips.filter((clip) => clip.track === 'screen' || clip.track === 'camera')) {
      const track = await inputs.get(clip.assetId)!.getPrimaryVideoTrack();
      if (!track || !(await track.canDecode()))
        throw new Error(`Cannot decode video in clip ${clip.id}.`);
      const times = Array.from(
        { length: clip.duration },
        (_, index) => sourceFrame(clip, clip.start + index) / FPS,
      );
      const iterator = new CanvasSink(track).canvasesAtTimestamps(times);
      iterators.push(iterator);
      visuals.push({ clip, iterator });
    }
    await output.start();
    onProgress(0.1);
    if (audio && mixed) {
      await audio.add(mixed);
      audio.close();
    }
    for (let frame = 0; frame < frames; frame++) {
      check();
      context.setTransform(width / 1280, 0, 0, height / 720, 0, 0);
      context.fillStyle = '#172324';
      context.fillRect(0, 0, 1280, 720);
      for (const track of ['screen', 'camera'] as const) {
        const screen = track === 'screen';
        const x = screen ? (layout.swapped ? 390 : 10) : layout.swapped ? 10 : 908;
        const w = screen ? 880 : 362;
        context.save();
        context.beginPath();
        context.roundRect(x, 10, w, 700, Math.max(0, layout.radius));
        context.clip();
        context.fillStyle = '#10181b';
        context.fillRect(x, 10, w, 700);
        const zoom = screen ? zoomCamera(zooms, frame) : { scale: 1, x: 0, y: 0 };
        context.translate(x + w / 2 + (zoom.x * w) / 100, 360 + (zoom.y * 700) / 100);
        context.scale(zoom.scale, zoom.scale);
        for (const { clip, iterator } of visuals) {
          if (clip.track !== track || !covers(clip, frame)) continue;
          const sample = (await iterator.next()).value;
          check();
          if (!sample) continue;
          const image = sample.canvas;
          const cover = Math.max(w / image.width, 700 / image.height);
          const dw = image.width * cover,
            dh = image.height * cover;
          const px = screen ? layout.screenX : layout.cameraX;
          const py = screen ? layout.screenY : layout.cameraY;
          context.drawImage(
            image,
            -w / 2 + ((w - dw) * px) / 100,
            -350 + ((700 - dh) * py) / 100,
            dw,
            dh,
          );
        }
        context.restore();
      }
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
