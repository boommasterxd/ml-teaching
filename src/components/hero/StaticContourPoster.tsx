/** Build-time contour artwork is also the reduced-motion and unavailable-GPU view. */
export default function StaticContourPoster() {
  return (
    <svg
      className="hero-field-poster"
      viewBox="0 0 720 620"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden="true"
    >
      {Array.from({ length: 19 }, (_, level) => {
        const radius = 32 + level * 17;
        const points = Array.from({ length: 64 }, (_, point) => {
          const angle = (point / 64) * Math.PI * 2;
          const contour =
            radius + Math.sin(angle * 3 + level * 0.12) * 18 + Math.cos(angle * 5) * 7;
          return `${(360 + Math.cos(angle) * contour).toFixed(1)},${(300 + Math.sin(angle) * contour * 0.82).toFixed(1)}`;
        });
        return (
          <path
            key={level}
            d={`M${points.join('L')}Z`}
            stroke="currentColor"
            strokeWidth={level % 4 === 0 ? 1.5 : 0.75}
            opacity={level % 4 === 0 ? 0.8 : 0.4}
          />
        );
      })}
    </svg>
  );
}
