/**
 * index.ts
 *
 * Barrel file re-exporting all modal components used across the application.
 * Includes dialogs for confirmation, image preview, privacy consent, camera
 * consent, and loading states.
 */

export { default as ConfirmDialog } from './ConfirmDialog';
export { default as ImagePreviewModal } from './ImagePreviewModal';
export { default as ConsentModal } from './ConsentModal';
export { default as CameraConsentModal } from './CameraConsentModal';
export { default as LoadingModal } from './LoadingModal';
