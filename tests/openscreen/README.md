# OpenScreen cursor sidecar checks

Manual checks of OpenScreen's `<video>.cursor.json` sidecar against a real recording on macOS. They
are not part of CI. Recordings and frames stay on the machine that made them.

- `verify_sidecar.py <video>` checks that the cursor is absent from the video pixels. It compares
  each sampled frame with that sample's cursor bitmap and asserts a positive control. It assumes a
  3440x1440 capture (`W`, `H` at the top).
- `flip.html` is the stimulus for the clock check. Each left mouse-down flips the page between green
  and magenta.
- `clock_offset.py <video>` finds every colour flip by frame PTS and reports flip time minus the
  press's `click` `timeMs`. It also reports median, spread, and drift slope. It collapses
  back-to-back `click` samples with no `mouseup` between them into one press.

Run them with:

```sh
uv run -q --no-project --with numpy --with pillow python -I tests/openscreen/verify_sidecar.py <video>
uv run -q --no-project --with numpy python -I tests/openscreen/clock_offset.py <video>
```

Findings from November 2026 with OpenScreen 2.2.2: the cursor is absent from the pixels, and there
is no clock drift over a 139 s take. The offset median is 7 ms, with roughly ±1 frame of jitter from
the ~43 ms cursor poll.
