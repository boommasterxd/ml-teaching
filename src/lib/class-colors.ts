/** Static palette tokens keep the build-rendered workspace free of inline style attributes. */
const PALETTE_CLASSES: Record<string, string> = {
  '#dc2626': '[--btn-color:#dc2626] [--class-on-surface:var(--class-red-on-surface)]',
  '#2563eb': '[--btn-color:#2563eb] [--class-on-surface:var(--class-blue-on-surface)]',
  '#047857': '[--btn-color:#047857] [--class-on-surface:var(--class-green-on-surface)]',
  '#b45309': '[--btn-color:#b45309] [--class-on-surface:var(--class-orange-on-surface)]',
  '#7c3aed': '[--btn-color:#7c3aed] [--class-on-surface:var(--class-purple-on-surface)]',
  '#db2777': '[--btn-color:#db2777] [--class-on-surface:var(--class-pink-on-surface)]',
};

export function classColorClasses(color: string): string {
  return PALETTE_CLASSES[color] ?? PALETTE_CLASSES['#dc2626'];
}
