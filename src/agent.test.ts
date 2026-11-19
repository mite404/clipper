import { afterEach, describe, expect, it, vi } from 'vitest';
import { runRequest, timelineLines, toolsFor, type ToolRunner } from './agent';
import type { Asset } from './media';
import type { Clip } from './timeline-model';

const provider = { baseUrl: 'https://openrouter.ai/api/v1/', model: 'm', key: 'sk' };
const reply = (message: object) => new Response(JSON.stringify({ choices: [{ message }] }));

afterEach(() => vi.unstubAllGlobals());

describe('timelineLines', () => {
  it('moves source-time lines to timeline time and cuts them to the clip', () => {
    // Plays source 2-6 s at timeline 10-14 s.
    const clip = { id: 'a', assetId: 's', track: 'camera', start: 300, duration: 120, offset: 60 };
    const asset = {
      id: 's',
      transcript: {
        model: 'w',
        segments: [
          { start: 0, end: 1, text: 'before' },
          { start: 1.5, end: 3, text: ' hello ' },
          { start: 5, end: 8, text: 'tail' },
        ],
      },
    };
    expect(timelineLines([clip as Clip], [asset as unknown as Asset], () => 'A')).toEqual([
      { clip: 'A', start: 10, end: 11, text: 'hello' },
      { clip: 'A', start: 13, end: 14, text: 'tail' },
    ]);
  });
});

describe('runRequest', () => {
  it('offers the transcript tool only when opted in', () => {
    expect(toolsFor(false).map((t) => t.function.name)).not.toContain('transcript');
    expect(toolsFor(true).map((t) => t.function.name)).toContain('transcript');
  });

  it('runs tool calls until the model answers, and reports a tool error to the model', async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(
        reply({
          role: 'assistant',
          content: null,
          tool_calls: [{ id: '1', type: 'function', function: { name: 'act', arguments: '{}' } }],
        }),
      )
      .mockResolvedValueOnce(reply({ role: 'assistant', content: ' Cut it. ' }));
    vi.stubGlobal('fetch', fetch);
    const run = vi.fn<ToolRunner>().mockRejectedValue(new Error('refused'));
    const words = await runRequest(
      provider,
      'cut',
      { transcript: false, run, onStep: () => {} },
      new AbortController().signal,
    );
    expect(words).toBe('Cut it.');
    expect(fetch.mock.calls[0][0]).toBe('https://openrouter.ai/api/v1/chat/completions');
    const second = JSON.parse(fetch.mock.calls[1][1]?.body as string) as {
      messages: { role: string; content: string }[];
    };
    expect(second.messages.at(-1)).toMatchObject({ role: 'tool', content: '{"error":"refused"}' });
  });

  it('surfaces the provider error message', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ error: { message: 'Bad key' } }), { status: 401 }),
        ),
    );
    await expect(
      runRequest(
        provider,
        'cut',
        { transcript: false, run: vi.fn<ToolRunner>(), onStep: () => {} },
        new AbortController().signal,
      ),
    ).rejects.toThrow('Bad key');
  });
});
