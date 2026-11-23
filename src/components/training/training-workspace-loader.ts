type WorkspaceModule = typeof import('@/screens/TrainingWorkspace');

let pending: Promise<WorkspaceModule> | undefined;
let prepared: WorkspaceModule | undefined;

export function loadTrainingWorkspace() {
  pending ??= import('@/screens/TrainingWorkspace').then(
    (module) => {
      prepared = module;
      return module;
    },
    (error: unknown) => {
      pending = undefined;
      throw error;
    },
  );
  return pending;
}

export function getPreparedTrainingWorkspace() {
  return prepared;
}
