'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { prepareRoute } from '../prepare-route';
import { useMenuModule } from '../use-menu-module';

export type WithdrawalAction = 'return' | 'restart';

function loadDialog() {
  return import('./TrainingWithdrawalDialog');
}

interface Withdrawal {
  pathname: string;
  opener: HTMLElement | null;
  phase: 'waiting' | 'open' | WithdrawalAction;
}

export function useTrainingWithdrawal(
  pathname: string | null,
  returnTo: string | null,
  reopen: (opener: HTMLElement | null) => void,
) {
  const router = useRouter();
  const [withdrawal, setWithdrawal] = useState<Withdrawal | null>(null);
  const { module, prepare, failed } = useMenuModule(loadDialog);
  if (withdrawal && withdrawal.pathname !== pathname) setWithdrawal(null);

  function begin(waitForExit: boolean, opener: HTMLElement | null) {
    if (!pathname) return;
    prepare();
    setWithdrawal({ pathname, opener, phase: waitForExit ? 'waiting' : 'open' });
  }

  function showAfterExit() {
    setWithdrawal((current) =>
      current?.phase === 'waiting' ? { ...current, phase: 'open' } : current,
    );
  }

  function close(action: WithdrawalAction) {
    setWithdrawal((current) =>
      current?.phase === 'open' ? { ...current, phase: action } : current,
    );
  }

  const active = withdrawal?.pathname === pathname ? withdrawal : null;

  function finish(action: WithdrawalAction) {
    if (!active || window.location.pathname !== pathname) return;
    if (action === 'return' && returnTo) {
      router.push(returnTo, { transitionTypes: ['nav-back'] });
      return;
    }
    setWithdrawal(null);
    const { opener } = active;
    if (action === 'restart') {
      if (!returnTo) reopen(opener);
    } else {
      (opener?.isConnected ? opener : document.getElementById('main-content'))?.focus({
        preventScroll: true,
      });
    }
  }

  return {
    active,
    Dialog: module?.default,
    prepare,
    failed,
    begin,
    showAfterExit,
    close,
    finish,
    prepareReturn: () => {
      if (returnTo) prepareRoute(router, returnTo);
    },
  };
}
