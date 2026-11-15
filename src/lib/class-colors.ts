/** Static palette tokens keep the build-rendered workspace free of inline style attributes. */
const PALETTE_CLASSES: Record<string, string> = {
  '#dc2626': '[--btn-color:#dc2626]',
  '#2563eb': '[--btn-color:#2563eb]',
  '#047857': '[--btn-color:#047857]',
  '#b45309': '[--btn-color:#b45309]',
  '#7c3aed': '[--btn-color:#7c3aed]',
  '#db2777': '[--btn-color:#db2777]',
};

export function classColorClasses(color: string): string {
  return PALETTE_CLASSES[color] ?? PALETTE_CLASSES['#dc2626'];
}
