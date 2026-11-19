import type { ReactNode } from 'react';
import Button from './Button';
import { Dog } from './icons/dog';
import { Cat } from './icons/cat';
import { NetworkScene } from './network/NetworkScene';
import { Alert, AlertDescription } from './ui/alert';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from './ui/card';

const DEMO_SIGNALS = [
  { signal: 'dog', Icon: Dog, label: 'Hundebild zeigen' },
  { signal: 'cat', Icon: Cat, label: 'Katzenbild zeigen' },
] as const;

export function NetworkInputButtons({
  activeSignal = null,
  busy = false,
  onTrigger,
  onIntent,
}: {
  activeSignal?: 'dog' | 'cat' | null;
  busy?: boolean;
  onTrigger?: (signal: 'dog' | 'cat') => void;
  onIntent?: (signal: 'dog' | 'cat') => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {DEMO_SIGNALS.map(({ signal, Icon, label }) => (
        <Button
          key={signal}
          variant={activeSignal === signal ? 'default' : 'outline'}
          size="default"
          aria-label={label}
          data-signal={signal}
          data-active={activeSignal === signal}
          aria-disabled={busy || undefined}
          onPointerEnter={() => onIntent?.(signal)}
          onFocus={() => onIntent?.(signal)}
          onPointerDown={() => onIntent?.(signal)}
          onClick={() => {
            if (!busy) onTrigger?.(signal);
          }}
        >
          <Icon data-icon="inline-start" aria-hidden="true" />
          <span className="hidden sm:inline">{label}</span>
          <span className="sm:hidden">{signal === 'dog' ? 'Hundebild' : 'Katzenbild'}</span>
        </Button>
      ))}
    </div>
  );
}

export function DiagramSurface({
  children,
  isPreparing = false,
  controls,
}: {
  children: ReactNode;
  isPreparing?: boolean;
  controls?: ReactNode;
}) {
  return (
    <Card aria-busy={isPreparing || undefined}>
      <CardHeader className="network-header flex flex-col gap-5">
        <CardTitle as="h3">Vom Bild zur Vorhersage</CardTitle>
        <CardAction className="row-span-1 self-stretch lg:self-center">{controls}</CardAction>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/** Static diagram preserves the educational layout without inline style attributes. */
export function StaticNetworkDiagram() {
  return <NetworkScene />;
}

export function NetworkLoadAlert() {
  return (
    <div className="network-result">
      <Alert variant="destructive">
        <AlertDescription className="justify-items-center">
          Laden fehlgeschlagen. Wähle das Beispiel erneut.
        </AlertDescription>
      </Alert>
    </div>
  );
}
