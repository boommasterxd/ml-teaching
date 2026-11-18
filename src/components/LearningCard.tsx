import type { ComponentType, ReactNode } from 'react';
import { Badge } from './ui/badge';
import { Card, CardDescription, CardHeader, CardTitle } from './ui/card';

/** One standard Card composition keeps educational headings, icons and descriptions aligned. */
export default function LearningCard({
  title,
  description,
  icon: Icon,
  marker,
}: {
  title: string;
  description: ReactNode;
  icon: ComponentType<{ 'aria-hidden': true }>;
  marker: string;
}) {
  return (
    <Card className="image-training-step h-full">
      <CardHeader>
        <Badge variant="ghost" className="image-step-marker">
          <Icon aria-hidden />
          {marker}
        </Badge>
        <CardTitle as="h3">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
