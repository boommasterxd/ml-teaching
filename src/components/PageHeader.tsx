import type { ReactNode } from 'react';
import { EntryReveal } from './ui/entry-reveal';
import { Heading, Text } from './ui/typography';

export default function PageHeader({
  title,
  description,
  rightSlot,
}: {
  title: string;
  description: string;
  rightSlot?: ReactNode;
}) {
  return (
    <EntryReveal kind="navigation" asChild>
      <header className="training-header">
        <div>
          <Heading as="h1" className="training-title">
            {title}
          </Heading>
          <Text variant="muted" className="training-description">
            {description}
          </Text>
        </div>
        {rightSlot}
      </header>
    </EntryReveal>
  );
}
