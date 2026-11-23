import type { ReactNode } from 'react';
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
  );
}
