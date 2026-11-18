import { MAX_CHAPTER_TITLE, timecode, type Chapter } from './timeline-model';

/**
 * The Inspector's chapter section: the selected chapter's title, and the list copied for a video's
 * description. A title commits on Enter or blur, as one undo step; an empty one puts the old back.
 */
export function ChapterControls({
  chapters,
  selected,
  onRename,
  onCopy,
}: {
  chapters: Chapter[];
  selected?: Chapter;
  onRename: (frame: number, title: string) => void;
  onCopy: () => void;
}) {
  if (!chapters.length) return null;
  return (
    <section className="cursor-controls" aria-label="Chapters">
      <h3>Chapters</h3>
      {selected && (
        <label className="chapter-title">
          Title · {timecode(selected.frame)}
          <input
            key={`${selected.frame}-${selected.title}`}
            aria-label="Chapter title"
            maxLength={MAX_CHAPTER_TITLE}
            defaultValue={selected.title}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur();
            }}
            onBlur={(event) => {
              const title = event.currentTarget.value.trim();
              if (!title) event.currentTarget.value = selected.title;
              else if (title !== selected.title) onRename(selected.frame, title);
            }}
          />
        </label>
      )}
      <button type="button" className="secondary-button" onClick={onCopy}>
        Copy chapters
      </button>
    </section>
  );
}
