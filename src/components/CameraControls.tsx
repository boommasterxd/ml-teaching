import Button from './Button';
import { Pause } from './icons/pause';
import { Play } from './icons/play';
import { SwitchCamera } from './icons/switch-camera';
import { Spinner } from './ui/spinner';

export interface CameraView {
  stream: MediaStream | null;
  facingMode: 'user' | 'environment';
  active: boolean;
  pending: boolean;
  failed: boolean;
  onToggle: () => void;
  onSwitch: () => void;
}

export default function CameraControls({
  camera,
  onStartIntent,
}: {
  camera: CameraView;
  onStartIntent?: () => void;
}) {
  const { active, stream, pending, failed, onToggle, onSwitch } = camera;
  const label = active
    ? 'Kamera ausschalten'
    : failed
      ? 'Kamera erneut verbinden'
      : 'Kamera aktivieren';
  const Icon = active ? Pause : Play;
  const prepare = active ? undefined : onStartIntent;
  return (
    <>
      {!stream && (
        <p
          role="status"
          className="absolute inset-0 flex items-center justify-center gap-2 px-3 pb-12 text-center text-sm text-media-foreground"
        >
          {pending && <Spinner aria-hidden="true" />}
          {pending ? 'Kamera wird verbunden …' : failed ? 'Keine Kameraverbindung' : 'Kamera aus'}
        </p>
      )}
      <Button
        variant="secondary"
        size="icon"
        className="control-focus-media absolute bottom-2 left-2 size-11 shadow-sm"
        aria-label={label}
        title={label}
        onClick={onToggle}
        onPointerEnter={prepare}
        onPointerDown={prepare}
        onFocus={prepare}
      >
        <Icon data-icon aria-hidden="true" />
      </Button>
      <Button
        variant="secondary"
        size="icon"
        className="control-focus-media absolute right-2 bottom-2 size-11 shadow-sm"
        aria-label="Kamera wechseln"
        title="Kamera wechseln"
        aria-disabled={!stream || undefined}
        onClick={stream ? onSwitch : undefined}
      >
        <SwitchCamera data-icon aria-hidden="true" />
      </Button>
    </>
  );
}
