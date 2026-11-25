import type { ReactNode } from 'react';
import { Text, Heading } from '../ui/typography';
import { Separator } from '../ui/separator';
import { Empty, EmptyHeader } from '../ui/empty';
import { FeatureArtwork } from './FeatureArtwork';
import { KnnArtwork } from './KnnArtwork';
import { NETWORK_EXAMPLES, type ExampleSignal } from './examples';
import ExamplePhoto from './ExamplePhoto';

export const FLOW_PATHS = ['M10 50H110'];
export const FLOW_HEAD_PATHS = ['M110 50L90 30', 'M110 50L90 70'];

function FlowBridge({ children }: { children?: ReactNode }) {
  return (
    <div className="network-bridge" aria-hidden="true">
      <svg
        viewBox="0 0 120 100"
        fill="none"
        className="size-full"
        stroke="var(--muted-foreground)"
        strokeWidth="4"
      >
        <path d={FLOW_PATHS[0]} />
        {FLOW_HEAD_PATHS.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
      {children}
    </div>
  );
}

function NetworkStation({
  step,
  title,
  description,
  children,
  flow,
  terminal = false,
}: {
  step: string;
  title: string;
  description: string;
  children: ReactNode;
  flow?: ReactNode;
  terminal?: boolean;
}) {
  return (
    <li className="network-station">
      <div className="network-station-heading">
        <Text variant="muted">{step}</Text>
        <Heading as="h4" className="network-station-title">
          {title}
        </Heading>
      </div>
      <div className="network-visual-slot">{children}</div>
      <Text variant="muted">{description}</Text>
      {!terminal && <FlowBridge>{flow}</FlowBridge>}
    </li>
  );
}

function ResultPlaceholder() {
  return (
    <div className="network-readout">
      {(['Hund', 'Katze'] as const).map((label) => (
        <div key={label} className="network-score">
          <div className="flex items-center justify-between gap-4">
            <Text variant="small">{label}</Text>
            <Text variant="muted">—</Text>
          </div>
          <Separator />
        </div>
      ))}
    </div>
  );
}

interface SceneEffects {
  engine?: ReactNode;
  neighbors?: ReactNode;
  inbound?: ReactNode;
  matching?: ReactNode;
  outbound?: ReactNode;
  scan?: ReactNode;
  result?: ReactNode;
}

/** SSG and deferred playback share the same four ordered, explained stages. */
export function NetworkScene({
  signal = null,
  effects = {},
}: {
  signal?: ExampleSignal | null;
  effects?: SceneEffects;
}) {
  return (
    <ol className="network-studio" aria-label="Vom Beispielbild zur Ausgabe">
      <NetworkStation
        step="01 / Eingabe"
        title="Beispielbild"
        description={
          signal
            ? `${NETWORK_EXAMPLES[signal].name} · generiertes Beispielbild`
            : 'Wähle Hund oder Katze.'
        }
        flow={effects.inbound}
      >
        {signal ? (
          <div className="network-example-media rounded-xl border bg-muted shadow-sm">
            <ExamplePhoto signal={signal} className="network-example-photo" />
            {effects.scan}
            <span className="network-image-corner network-image-corner-start" aria-hidden="true" />
            <span className="network-image-corner network-image-corner-end" aria-hidden="true" />
          </div>
        ) : (
          <Empty className="network-example-media border p-0 md:p-0">
            <EmptyHeader>
              <Text variant="muted">Kein Bild gewählt</Text>
            </EmptyHeader>
          </Empty>
        )}
      </NetworkStation>
      <NetworkStation
        step="02 / Merkmale"
        title="MobileNet"
        description="Filter erkennen Muster. Daraus entsteht eine Liste von Zahlen."
        flow={effects.matching}
      >
        <div className="network-feature-volume">
          {effects.engine ?? <FeatureArtwork signal={signal ?? 'dog'} />}
        </div>
      </NetworkStation>
      <NetworkStation
        step="03 / Vergleich"
        title="KNN"
        description="Jeder Punkt ist ein Beispiel. Die drei nächsten Nachbarn stimmen ab."
        flow={effects.outbound}
      >
        <div className="network-feature-volume">{effects.neighbors ?? <KnnArtwork />}</div>
      </NetworkStation>
      <NetworkStation
        step="04 / Ausgabe"
        title="Mehrheit gewinnt"
        description="Das Bild bekommt den Namen mit den meisten Stimmen."
        terminal
      >
        {effects.result ?? <ResultPlaceholder />}
      </NetworkStation>
    </ol>
  );
}
