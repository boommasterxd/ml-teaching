import type { ComponentProps } from 'react';
import { vi } from 'vitest';
import TrainingSetupDialog from '@/components/modals/TrainingSetupDialog';

export function SetupDialogFixture(props: Partial<ComponentProps<typeof TrainingSetupDialog>>) {
  return (
    <TrainingSetupDialog
      initialContent
      step="consent"
      loadingText=""
      onWithdrawLoading={vi.fn()}
      onConfirmConsent={vi.fn()}
      onDeclineConsent={vi.fn()}
      onConfirmCamera={vi.fn()}
      onDeclineCamera={vi.fn()}
      {...props}
    />
  );
}
