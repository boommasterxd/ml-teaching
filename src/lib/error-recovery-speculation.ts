import { headerLegalLinks } from '@/content/site-navigation';
import { learningPaths } from '@/lib/learning-paths';

const recoveryDestinations = [
  '/',
  ...Object.values(learningPaths),
  ...headerLegalLinks.map(({ href }) => href),
];

export const ERROR_RECOVERY_SPECULATION_RULES = JSON.stringify({
  prerender: [
    {
      where: {
        and: [
          { selector_matches: 'a[data-recovery-intent]' },
          {
            href_matches: recoveryDestinations.map((pathname) => ({
              pathname,
              search: '',
              hash: '',
            })),
          },
        ],
      },
      eagerness: 'immediate',
    },
  ],
});
