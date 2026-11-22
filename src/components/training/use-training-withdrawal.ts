'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { prepareRoute } from '../prepare-route';
import { useMenuModule } from '../use-menu-module';

function loadDialog() {
  return import('./TrainingWithdrawalDialog');
}

interface Withdrawal {
  pathname: string;
  opener: HTMLElement | null;
  phase: 'waiting' | 'open' | 'closing';
}

export function useTrainingWithdrawal(pathname: string | null, inTraining: boolean) {
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

  function close() {
    setWithdrawal((current) =>
      current?.phase === 'open' ? { ...current, phase: 'closing' } : current,
    );
  }

  const active = withdrawal?.pathname === pathname ? withdrawal : null;

  function finish() {
    if (!active || window.location.pathname !== pathname) return;
    if (inTraining) {
      router.push('/', { transitionTypes: ['nav-back'] });
      return;
    }
    setWithdrawal(null);
    const { opener } = active;
    (opener?.isConnected ? opener : document.getElementById('main-content'))?.focus({
      preventScroll: true,
    });
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
    leavesTraining: inTraining,
    prepareHome: () => {
      if (inTraining) prepareRoute(router, '/');
    },
  };
}
