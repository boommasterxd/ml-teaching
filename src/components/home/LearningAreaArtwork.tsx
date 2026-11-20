import ExamplePhoto from '@/components/network/ExamplePhoto';

/** Fixed decorative scenes preview the two learning methods without mounting either workspace. */
export default function LearningAreaArtwork({ area }: { area: 'images' | 'q-learning' }) {
  return (
    <svg viewBox="0 0 440 160" fill="none" aria-hidden="true" className="learning-area-artwork">
      {area === 'images' ? (
        <>
          <rect className="artwork-surface" x="12" y="12" width="132" height="132" rx="18" />
          <foreignObject x="24" y="24" width="108" height="108">
            <ExamplePhoto signal="cat" decorative className="home-example-photo" />
          </foreignObject>
          <path className="artwork-accent" d="M160 78h34m-7-7 7 7-7 7" strokeWidth="2" />
          {Array.from({ length: 16 }, (_, index) => (
            <rect
              key={index}
              x={212 + (index % 4) * 18}
              y={45 + Math.floor(index / 4) * 18}
              width="12"
              height="12"
              rx="2"
              fill="currentColor"
              opacity={index % 3 === 0 ? 0.2 : 0.75}
            />
          ))}
          <path className="artwork-accent" d="M294 78h34m-7-7 7 7-7 7" strokeWidth="2" />
          <rect className="artwork-surface" x="345" y="47" width="81" height="62" rx="14" />
          <text x="386" y="84" textAnchor="middle" fill="currentColor" fontSize="17">
            Katze
          </text>
        </>
      ) : (
        <>
          {Array.from({ length: 15 }, (_, index) => (
            <rect
              key={index}
              className="artwork-surface"
              x={65 + (index % 5) * 61}
              y={6 + Math.floor(index / 5) * 49}
              width="51"
              height="39"
              rx="8"
            />
          ))}
          <circle cx="90" cy="123" r="10" className="reward-experiment-start" />
          <path
            className="reward-experiment-route"
            d="M90 123H143Q151 123 151 115V82Q151 74 159 74H265Q273 74 273 66V32Q273 24 281 24H334"
          />
          <path
            className="reward-experiment-goal"
            data-rewarded="true"
            d="m334 9 4.4 9.4 10.4 1.4-7.6 7.2 1.9 10.2-9.1-5-9.1 5 1.9-10.2-7.6-7.2 10.4-1.4Z"
          />
          <circle cx="334" cy="24" r="4" className="reward-experiment-agent" />
        </>
      )}
    </svg>
  );
}
