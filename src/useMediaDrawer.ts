import { useEffect, useRef, useState } from 'react';

type Drawer = { mode: 'pinned' | 'closed' | 'peek'; instant: boolean };

const FINE_HOVER = '(hover: hover) and (pointer: fine)';
const ZONES = '[aria-controls="media-drawer"], .media-hot-zone, #media-drawer';

function inMediaZone(target: EventTarget | null) {
  return target instanceof Element && target.closest(ZONES) !== null;
}

/** Keeps the mounted media pool pinned, away, or temporarily over the workspace under a pointer. */
export function useMediaDrawer(blocked: boolean) {
  const [view, setView] = useState<Drawer>({ mode: 'pinned', instant: true });
  const panel = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const suppressed = useRef(true);
  const over = useRef(false);

  useEffect(() => {
    if (view.mode === 'pinned') return;
    const query = window.matchMedia(FINE_HOVER);
    let timer: ReturnType<typeof setTimeout>;
    const held = () => panel.current?.contains(document.activeElement);
    const close = (instant: boolean) => {
      clearTimeout(timer);
      suppressed.current = true;
      if (held()) toggle.current?.focus();
      setView({ mode: 'closed', instant });
    };
    if (blocked) {
      if (view.mode === 'peek') close(true);
      return;
    }
    const leave = () => {
      clearTimeout(timer);
      if (view.mode !== 'peek') return;
      timer = setTimeout(() => {
        if (panel.current?.querySelector(':focus-visible')) return;
        if (held()) toggle.current?.focus();
        setView({ mode: 'closed', instant: false });
      }, 250);
    };
    const enter = () => {
      if (suppressed.current || view.mode !== 'closed') return;
      timer = setTimeout(() => setView({ mode: 'peek', instant: false }), 80);
    };
    const point = (target: EventTarget | null) => {
      const inside = inMediaZone(target);
      if (!inside) suppressed.current = false;
      if (over.current === inside) return;
      over.current = inside;
      clearTimeout(timer);
      if (inside) enter();
      else leave();
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'touch' && query.matches) point(event.target);
    };
    const onLeave = () => point(null);
    const onFocusOut = () => {
      if (!over.current && view.mode === 'peek') leave();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || view.mode !== 'peek') return;
      event.preventDefault();
      close(true);
    };
    const onCancel = () => close(true);
    document.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    document.addEventListener('pointercancel', onCancel);
    document.addEventListener('focusout', onFocusOut);
    document.addEventListener('keydown', onKey);
    window.addEventListener('blur', onCancel);
    query.addEventListener('change', onCancel);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('pointercancel', onCancel);
      document.removeEventListener('focusout', onFocusOut);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('blur', onCancel);
      query.removeEventListener('change', onCancel);
    };
  }, [view.mode, blocked]);

  const onToggle = () => {
    suppressed.current = true;
    if (panel.current?.contains(document.activeElement)) toggle.current?.focus();
    setView({ mode: view.mode === 'pinned' ? 'closed' : 'pinned', instant: true });
  };
  return { ...view, panel, toggle, onToggle };
}
