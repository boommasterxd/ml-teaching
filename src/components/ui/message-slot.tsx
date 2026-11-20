import type { ReactNode } from 'react';

/** Reserve the wrapped height of the longest message at the available width. */
export function MessageSlot({
  messages,
  children,
}: {
  messages: readonly string[];
  children: ReactNode;
}) {
  return (
    <span className="grid min-w-0 grid-cols-[minmax(0,1fr)] *:col-start-1 *:row-start-1">
      {messages.map((message) => (
        <span
          key={message}
          aria-hidden="true"
          data-message={message}
          className="invisible before:content-[attr(data-message)]"
        />
      ))}
      <span>{children}</span>
    </span>
  );
}
