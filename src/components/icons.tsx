'use client';

import { useSyncExternalStore, type ComponentType } from 'react';
import type { IconProps } from '@animate-ui/react/icons';
import * as Static from 'lucide-react';
import { ArrowLeft as AnimatedArrowLeft } from './animate-ui/icons/arrow-left';
import { ArrowRight as AnimatedArrowRight } from './animate-ui/icons/arrow-right';
import { Camera as AnimatedCamera } from './animate-ui/icons/camera';
import { Check as AnimatedCheck } from './animate-ui/icons/check';
import { CircleAlert } from './animate-ui/icons/circle-alert';
import { CircleCheckBig } from './animate-ui/icons/circle-check-big';
import { House } from './animate-ui/icons/house';
import { Image as AnimatedImage } from './animate-ui/icons/image';
import { Lightbulb as AnimatedLightbulb } from './animate-ui/icons/lightbulb';
import { LoaderCircle } from './animate-ui/icons/loader-circle';
import { Play as AnimatedPlay } from './animate-ui/icons/play';
import { Plus as AnimatedPlus } from './animate-ui/icons/plus';
import { RotateCcw as AnimatedRotateCcw } from './animate-ui/icons/rotate-ccw';
import { Smartphone as AnimatedSmartphone } from './animate-ui/icons/smartphone';
import { Trash2 as AnimatedTrash2 } from './animate-ui/icons/trash-2';
import { TriangleAlert } from './animate-ui/icons/triangle-alert';
import { Upload as AnimatedUpload } from './animate-ui/icons/upload';
import { Users as AnimatedUsers } from './animate-ui/icons/users';
import { X as AnimatedX } from './animate-ui/icons/x';
import { Zap as AnimatedZap } from './animate-ui/icons/zap';

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

/** Motion's initial style attributes are excluded from strict-CSP static HTML. */
function clientIcon<T extends string>(
  Animated: ComponentType<IconProps<T>>,
  Fallback: Static.LucideIcon,
) {
  return function ClientIcon(props: IconProps<T>) {
    const isClient = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
    if (isClient) return <Animated {...props} />;
    const hidden = props['aria-hidden'];

    return (
      <Fallback
        size={props.size ?? 28}
        className={typeof props.className === 'string' ? props.className : undefined}
        aria-hidden={
          hidden === true || hidden === false || hidden === 'true' || hidden === 'false'
            ? hidden
            : undefined
        }
        aria-label={typeof props['aria-label'] === 'string' ? props['aria-label'] : undefined}
        role={typeof props.role === 'string' ? props.role : undefined}
        fill={typeof props.fill === 'string' ? props.fill : undefined}
        strokeWidth={typeof props.strokeWidth === 'number' ? props.strokeWidth : undefined}
      />
    );
  };
}

export const ArrowLeft = clientIcon(AnimatedArrowLeft, Static.ArrowLeft);
export const ArrowRight = clientIcon(AnimatedArrowRight, Static.ArrowRight);
export const Camera = clientIcon(AnimatedCamera, Static.Camera);
export const Check = clientIcon(AnimatedCheck, Static.Check);
export const AlertCircle = clientIcon(CircleAlert, Static.AlertCircle);
export const CheckCircle2 = clientIcon(CircleCheckBig, Static.CheckCircle2);
export const Home = clientIcon(House, Static.Home);
export const Image = clientIcon(AnimatedImage, Static.Image);
export const Lightbulb = clientIcon(AnimatedLightbulb, Static.Lightbulb);
export const Loader2 = clientIcon(LoaderCircle, Static.Loader2);
export const Play = clientIcon(AnimatedPlay, Static.Play);
export const Plus = clientIcon(AnimatedPlus, Static.Plus);
export const RotateCcw = clientIcon(AnimatedRotateCcw, Static.RotateCcw);
export const Smartphone = clientIcon(AnimatedSmartphone, Static.Smartphone);
export const Trash2 = clientIcon(AnimatedTrash2, Static.Trash2);
export const AlertTriangle = clientIcon(TriangleAlert, Static.AlertTriangle);
export const Upload = clientIcon(AnimatedUpload, Static.Upload);
export const Users = clientIcon(AnimatedUsers, Static.Users);
export const X = clientIcon(AnimatedX, Static.X);
export const Zap = clientIcon(AnimatedZap, Static.Zap);

// These original glyphs have no matching Animate UI Lucide catalog entry.
export { Brain, Car, Cat, Dog, ImagePlus, Square, Stethoscope, SwitchCamera } from 'lucide-react';
