import { useId, type ReactNode } from 'react';

type Goal = 'star' | 'treasure';
const routes = {
  star: {
    name: 'Stern',
    cell: 4,
    path: 'M40 244V188Q40 176 52 176H96Q108 176 108 164V120Q108 108 120 108H164Q176 108 176 96V52Q176 40 188 40H312',
    steps: 7,
  },
  treasure: {
    name: 'Schatz',
    cell: 19,
    path: 'M40 244H96Q108 244 108 232V188Q108 176 120 176H300Q312 176 312 188V244',
    steps: 6,
  },
} as const;
const cells = Array.from({ length: 20 }, (_, index) => ({
  x: 12 + (index % 5) * 68,
  y: 12 + Math.floor(index / 5) * 68,
}));
const barriers = [5, 8, 18];
const cellSize = 56;
const cellRadius = 12;
export const rewardPreviewDescription = `Der Agent startet links unten. Er nimmt ${routes.star.steps} Schritte zum Stern rechts oben oder ${routes.treasure.steps} Schritte zum Schatz rechts unten und weicht den Hindernissen aus.`;

export function RewardGoalMarker({ goal, highlighted }: { goal: Goal; highlighted: boolean }) {
  return (
    <g className="reward-experiment-goal" data-goal={goal} data-rewarded={highlighted}>
      {goal === 'star' ? (
        <path d="m312 23 5 11 12 2-9 8 2 12-10-6-10 6 2-12-9-8 12-2Z" />
      ) : (
        <>
          <rect x="296" y="234" width="32" height="23" rx="4" />
          <path d="M296 243h32m-26-9v-5h20v5m-10 5v9" />
        </>
      )}
    </g>
  );
}

function describeGoal(goal: Goal | null) {
  return goal
    ? `Beispielweg zum ${routes[goal].name}: ${routes[goal].steps} Schritte um die Hindernisse.`
    : 'Der Agent startet links unten. Der Stern liegt rechts oben, der Schatz rechts unten.';
}

export function RewardBoard({
  highlightedGoal = null,
  showAgentAtStart = !highlightedGoal,
  description = describeGoal(highlightedGoal),
  children,
}: {
  highlightedGoal?: Goal | null;
  showAgentAtStart?: boolean;
  description?: string;
  children?: ReactNode;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const barrierPattern = useId();
  return (
    <svg
      className="reward-experiment-board"
      viewBox="0 0 352 284"
      role="img"
      aria-labelledby={`${titleId} ${descriptionId}`}
    >
      <title id={titleId}>Ein Agent, zwei mögliche Ziele</title>
      <desc id={descriptionId}>{description}</desc>
      <defs>
        <pattern id={barrierPattern} patternUnits="userSpaceOnUse" width="9" height="9">
          <path d="M-2 2 2-2M0 9 9 0M7 11 11 7" className="reward-barrier-hatch" />
        </pattern>
      </defs>
      {cells.map(({ x, y }, index) => (
        <rect
          key={index}
          x={x}
          y={y}
          width={cellSize}
          height={cellSize}
          rx={cellRadius}
          fill={barriers.includes(index) ? `url(#${barrierPattern})` : undefined}
          className={barriers.includes(index) ? 'reward-experiment-wall' : 'reward-experiment-cell'}
        />
      ))}
      <g className="reward-route-guides" aria-hidden="true">
        <path d={routes.star.path} />
        <path d={routes.treasure.path} />
      </g>
      <RewardGoalMarker goal="star" highlighted={highlightedGoal === 'star'} />
      <RewardGoalMarker goal="treasure" highlighted={highlightedGoal === 'treasure'} />
      <circle cx="40" cy="244" r="15" className="reward-experiment-start" />
      {showAgentAtStart && <circle cx="40" cy="244" r="6" className="reward-experiment-agent" />}
      {children}
    </svg>
  );
}

export { type Goal, routes, cells, cellSize, cellRadius };
