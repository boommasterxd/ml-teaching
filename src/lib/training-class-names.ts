import { z } from 'zod';
import { ML } from '@/constants';

const trainingClassNameErrors = {
  empty: 'Gib der Klasse einen Namen',
  duplicate: 'Dieser Name wird schon verwendet',
  tooLong: `Kürze den Namen auf höchstens ${ML.MAX_CLASS_NAME_LENGTH} Zeichen`,
};

const classNameEntry = z.object({
  classId: z.string(),
  name: z
    .string()
    .max(ML.MAX_CLASS_NAME_LENGTH, trainingClassNameErrors.tooLong)
    .refine((name) => name.trim().length > 0, trainingClassNameErrors.empty),
});

const trainingClassNamesSchema = z
  .object({ names: z.array(classNameEntry).max(ML.MAX_CLASSES) })
  .superRefine(({ names }, context) => {
    const indexesByName = new Map<string, number[]>();
    names.forEach(({ name }, index) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const indexes = indexesByName.get(trimmed);
      if (indexes) indexes.push(index);
      else indexesByName.set(trimmed, [index]);
    });
    for (const indexes of indexesByName.values()) {
      if (indexes.length < 2) continue;
      for (const index of indexes) {
        context.addIssue({
          code: 'custom',
          message: trainingClassNameErrors.duplicate,
          path: ['names', index, 'name'],
        });
      }
    }
  });

export type TrainingClassNames = z.input<typeof trainingClassNamesSchema>;

export type ClassNameValidity = {
  hasInvalidNames: boolean;
  hasDuplicateNames: boolean;
};

/** Share a snapshot between the form resolver, render and immediate training activation. */
export function createClassNameValidator() {
  let previous: { key: string; result: ReturnType<typeof validateClassNames> } | undefined;

  return (values: TrainingClassNames) => {
    // React Hook Form can mutate its values in place. The key captures their contents.
    const key = JSON.stringify(values.names);
    if (previous?.key === key) return previous.result;
    const result = validateClassNames(values);
    previous = { key, result };
    return result;
  };
}

function validateClassNames(values: TrainingClassNames) {
  const parsed = trainingClassNamesSchema.safeParse(values);
  const issues = parsed.error?.issues ?? [];
  return {
    parsed,
    validity: {
      hasInvalidNames: issues.some(({ message }) => message !== trainingClassNameErrors.duplicate),
      hasDuplicateNames: issues.some(
        ({ message }) => message === trainingClassNameErrors.duplicate,
      ),
    } satisfies ClassNameValidity,
  };
}
