import type { ComponentType, ReactNode } from 'react';
import { Badge } from './ui/badge';
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from './ui/card';

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
    <Card className="h-full">
      <CardHeader className="items-center">
        <CardTitle as="h3" className="self-center">
          {title}
        </CardTitle>
        <CardAction className="row-span-1 self-center">
          <Badge variant="secondary">
            <Icon aria-hidden />
            {marker}
          </Badge>
        </CardAction>
        <CardDescription className="col-span-full">{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
