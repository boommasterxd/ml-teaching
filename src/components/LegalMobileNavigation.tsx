'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown } from './icons/chevron-down';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

/** Three static links reuse the menu primitives already loaded by the site header. */
export default function LegalMobileNavigation({ children }: { children: ReactNode }) {
  const keyboardOpening = useRef(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (open && keyboardOpening.current)
      content.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
  }, [open]);
  return (
    <div className="legal-mobile-navigation">
      <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          asChild
          ref={trigger}
          onPointerDown={() => {
            keyboardOpening.current = false;
          }}
          onKeyDown={(event) => {
            keyboardOpening.current = ['Enter', ' ', 'ArrowDown'].includes(event.key);
          }}
        >
          <Button variant="outline">
            Informationen
            <ChevronDown data-icon="inline-end" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          ref={content}
          aria-label="Informationsseiten"
          onEscapeKeyDown={() => trigger.current?.focus({ preventScroll: true })}
          onCloseAutoFocus={(event) => event.preventDefault()}
        >
          <DropdownMenuGroup>{children}</DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
