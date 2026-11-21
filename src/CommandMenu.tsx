import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@ui-sdk/react/command';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@ui-sdk/react/dialog';
import { Search } from 'lucide-react';
import { useRef } from 'react';

type EditorCommand = { id: string; label: string; disabled?: boolean; run: () => void };

const styles = `
  .command-menu {
    position: fixed;
    inset: min(18dvh, 120px) 0 auto;
    margin: 0 auto;
    width: min(460px, calc(100vw - 24px));
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 12px;
    background: var(--popover);
    color: var(--foreground);
    box-shadow: 0 20px 64px #0009;
  }
  .command-menu::backdrop { background: #0009; }
  .command-menu-header, .command-menu-search {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .command-menu-header { justify-content: space-between; margin-bottom: 10px; }
  .command-menu-header h2 { font-size: 14px; margin: 0; }
  .command-menu-header .secondary-button { width: auto; }
  .command-menu-search {
    padding: 0 10px;
    color: var(--muted-foreground);
    border: 1px solid var(--input);
    border-radius: 7px;
  }
  .command-menu-search:focus-within { border-color: var(--ring); }
  .command-menu-search input {
    flex: 1;
    min-width: 0;
    padding: 9px 0;
    background: none;
    border: 0;
    outline: 0;
    color: var(--foreground);
  }
  .command-menu-search input::placeholder { color: var(--muted-foreground); }
  .command-menu-list { margin-top: 6px; max-height: min(260px, 50dvh); overflow-y: auto; }
  .command-menu-item { padding: 9px 10px; border-radius: 7px; cursor: pointer; overflow-wrap: anywhere; }
  .command-menu-item[data-highlighted] { background: var(--accent); box-shadow: inset 2px 0 var(--green); }
  .command-menu-item[aria-disabled='true'], .command-menu-empty { color: var(--muted-foreground); }
  .command-menu-empty:not(:empty) { padding: 16px 10px; }
`;

/** Searches caller-provided actions. The caller owns open state and editor shortcuts. */
export function CommandMenu({
  open,
  onOpenChange,
  commands,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commands: readonly EditorCommand[];
}) {
  const search = useRef<HTMLInputElement>(null);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger className="secondary-button">Search commands</DialogTrigger>
      <DialogContent
        className="command-menu"
        initialFocus={() => search.current}
        onKeyDownCapture={(event) => {
          if (event.key !== 'Escape' || event.nativeEvent.isComposing) return;
          // Command consumes Escape to clear its query. Here Escape dismisses the menu instead.
          event.preventDefault();
          event.stopPropagation();
          onOpenChange(false);
        }}
      >
        <style>{styles}</style>
        <div className="command-menu-header">
          <DialogTitle>Command menu</DialogTitle>
          <DialogClose className="secondary-button">Close</DialogClose>
        </div>
        <Command
          filter="contains"
          autoHighlight
          onAction={(id) => {
            const command = commands.find((item) => item.id === id);
            if (!command || command.disabled) return;
            onOpenChange(false);
            command.run();
          }}
        >
          <div className="command-menu-search">
            <Search aria-hidden="true" size={14} />
            <CommandInput ref={search} aria-label="Search commands" placeholder="Search actions…" />
          </div>
          <CommandEmpty className="command-menu-empty">No matching commands</CommandEmpty>
          <CommandList className="command-menu-list">
            {commands.map(({ id, label, disabled }) => (
              <CommandItem key={id} value={id} disabled={disabled} className="command-menu-item">
                {label}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
