import { Effect } from '@animate-ui/react/primitives/effects/effect';
import { motionTokens, useShouldReduceMotion } from '@animate-ui/react/utils/motion';
import { KNN_EXAMPLES, KNN_NEIGHBOR_COUNT, type ExampleSignal } from '@/lib/network-demo';
import { Cat } from '../icons/cat';
import { Dog } from '../icons/dog';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { NETWORK_EXAMPLES } from './examples';
import { KnnPoint } from './KnnArtwork';

function VoteGraphic({ signal }: { signal: ExampleSignal }) {
  const { neighbors, winner } = KNN_EXAMPLES[signal];
  const reduce = useShouldReduceMotion();
  const Icon = winner === 'dog' ? Dog : Cat;
  return (
    <div className="network-vote-graphic" aria-hidden="true">
      <svg viewBox="0 0 152 60" fill="none" className="size-full">
        {neighbors.map((neighbor, index) => {
          const y = 10 + index * 20;
          return (
            <g key={neighbor.id}>
              <Effect
                asChild
                initial={reduce ? false : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: 0.38,
                  delay: reduce ? 0 : index * 0.08,
                  ease: motionTokens.ease.draw,
                }}
              >
                <path d={`M13 ${y}H30C54 ${y} 56 30 78 30`} className="network-vote-path" />
              </Effect>
              <KnnPoint x={9} y={y} signal={neighbor.signal} />
            </g>
          );
        })}
        <Effect
          asChild
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.2, delay: reduce ? 0 : 0.5, ease: motionTokens.ease.draw }}
        >
          <path d="M78 30H112" className="network-vote-trunk" />
        </Effect>
      </svg>
      <Effect
        asChild
        initial={reduce ? false : { scale: 0.82, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.28, delay: reduce ? 0 : 0.62, ease: motionTokens.ease.draw }}
      >
        <span className="network-winner-seal">
          <Icon aria-hidden="true" className="size-3/5" />
        </span>
      </Effect>
    </div>
  );
}

export default function ResultFeedback({ signal }: { signal: ExampleSignal }) {
  const { votes, winner } = KNN_EXAMPLES[signal];
  const label = NETWORK_EXAMPLES[winner].name;
  return (
    <Alert variant="result" role="presentation" className="network-verdict">
      <AlertTitle className="col-start-1 row-start-1 self-end">{label} erkannt</AlertTitle>
      <AlertDescription className="col-start-1 row-start-2 self-start">
        {votes[winner]} von {KNN_NEIGHBOR_COUNT} Nachbarn stimmen für {label}.
      </AlertDescription>
      <VoteGraphic signal={signal} />
    </Alert>
  );
}
