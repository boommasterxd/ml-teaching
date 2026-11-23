import { z } from 'zod';
import { ML } from '@/constants';

export const trainingClassNameErrors = {
  empty: 'Name darf nicht leer sein',
  duplicate: 'Name muss eindeutig sein',
  tooLong: `Name darf höchstens ${ML.MAX_CLASS_NAME_LENGTH} Zeichen haben`,
};

const classNameEntry = z.object({
  classId: z.string(),
  name: z
    .string()
    .max(ML.MAX_CLASS_NAME_LENGTH, trainingClassNameErrors.tooLong)
    .refine((name) => name.trim().length > 0, trainingClassNameErrors.empty),
});

export const trainingClassNamesSchema = z
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
