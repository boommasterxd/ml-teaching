export function canReturnFocus(target: HTMLElement | null): target is HTMLElement {
  return Boolean(
    target?.isConnected &&
    target !== document.body &&
    !target.closest('[inert], [aria-hidden="true"], [data-state="closed"], [hidden]') &&
    !target.matches(':disabled'),
  );
}

export function getReturnFocusCandidates(opener: HTMLElement | null) {
  const classInputs = [...document.querySelectorAll<HTMLElement>('input[id^="class-name-"]')];
  const following = classInputs.filter(
    (input) => opener && opener.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING,
  );
  const preceding = classInputs.filter((input) => !following.includes(input)).reverse();
  return [
    opener,
    ...following,
    ...preceding,
    document.querySelector<HTMLElement>('#main-content h1[tabindex="-1"]'),
    document.getElementById('main-content'),
  ];
}
