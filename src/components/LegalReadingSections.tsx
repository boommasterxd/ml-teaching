import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import LegalReadingMotion from './LegalReadingMotion';

const sectionHeadings = new Set(['h2', 'h3', 'h4']);

function flattenFragments(children: ReactNode): ReactNode[] {
  return Children.toArray(children).flatMap((child) =>
    isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment
      ? flattenFragments(child.props.children)
      : [child],
  );
}

/** Keep controlled copy server-rendered and reveal one heading-led reading group at a time. */
export default function LegalReadingSections({ children }: { children: ReactNode }) {
  const sections: ReactNode[][] = [];
  for (const child of flattenFragments(children)) {
    const startsSection =
      isValidElement(child) && typeof child.type === 'string' && sectionHeadings.has(child.type);
    if (startsSection || sections.length === 0) sections.push([]);
    sections[sections.length - 1].push(child);
  }

  return (
    <LegalReadingMotion>
      {sections.map((section, index) => (
        <div key={index} className="legal-reading-section">
          {section}
        </div>
      ))}
    </LegalReadingMotion>
  );
}
