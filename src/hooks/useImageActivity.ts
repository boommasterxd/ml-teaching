import { useState, useRef, useCallback } from 'react';

/** Synchronous guards cover the interval before React publishes the next UI state. */
export function useImageActivity(
  isTrainingActive: () => boolean,
  onWarning: (message: string) => void,
) {
  const uploadsRef = useRef(0);
  const imagesRef = useRef(0);
  const [uploadCount, setUploadCount] = useState(0);
  const beginUpload = useCallback(() => {
    if (isTrainingActive()) {
      onWarning(
        'Bitte warte, bis das Training abgeschlossen ist, bevor du weitere Bilder auswählst.',
      );
      return false;
    }
    uploadsRef.current++;
    setUploadCount(uploadsRef.current);
    return true;
  }, [isTrainingActive, onWarning]);
  const endUpload = useCallback(() => {
    uploadsRef.current = Math.max(0, uploadsRef.current - 1);
    setUploadCount(uploadsRef.current);
  }, []);
  const beginImage = useCallback(() => {
    imagesRef.current++;
  }, []);
  const endImage = useCallback(() => {
    imagesRef.current = Math.max(0, imagesRef.current - 1);
  }, []);
  const isBusy = useCallback(() => uploadsRef.current > 0 || imagesRef.current > 0, []);
  return { beginUpload, endUpload, beginImage, endImage, isBusy, hasUploads: uploadCount > 0 };
}
