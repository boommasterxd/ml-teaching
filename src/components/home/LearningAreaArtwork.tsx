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
          <path className="artwork-detail" d="M90 24h122v50h61v49" strokeWidth="3" />
          <path
            className="artwork-accent"
            d="M90 123h61V74h122V24h61m-7-7 7 7-7 7"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="90" cy="123" r="9" fill="currentColor" />
          <circle
            cx="334"
            cy="24"
            r="14"
            fill="var(--card)"
            stroke="currentColor"
            strokeWidth="2"
          />
          <text x="334" y="29" textAnchor="middle" fontSize="15" fill="currentColor">
            +1
          </text>
        </>
      )}
    </svg>
  );
}
