import type { ReactNode } from 'react';
import { EntryReveal } from './ui/entry-reveal';
import { Heading, Text } from './ui/typography';

export function LearningChapterIntro({ title, children }: { title: string; children: ReactNode }) {
  return (
    <header className="learning-hub-intro">
      <Heading as="h1" className="learning-hub-heading">
        {title}
      </Heading>
      <EntryReveal kind="reading" asChild>
        <Text variant="lead">{children}</Text>
      </EntryReveal>
    </header>
  );
}

export function LearningPrompt({ title, children }: { title: string; children: ReactNode }) {
  return (
    <EntryReveal kind="reading" asChild>
      <div>
        <Heading as="h3">{title}</Heading>
        <Text>{children}</Text>
      </div>
    </EntryReveal>
  );
}
