import { preload } from 'react-dom';

const mobile = '/hero-glass-mobile.webp';
const desktop = '/hero-glass.webp';

/** The first full-color glass frame is available before hydration and without WebGL. */
export default function StaticContourPoster() {
  preload(mobile, { as: 'image', media: '(width < 48rem)', fetchPriority: 'high' });
  preload(desktop, { as: 'image', media: '(width >= 48rem)', fetchPriority: 'high' });
  return (
    <picture className="hero-field-poster">
      <source media="(width >= 48rem)" srcSet={desktop} width="954" height="900" />
      <img src={mobile} width="615" height="500" fetchPriority="high" alt="" />
    </picture>
  );
}
