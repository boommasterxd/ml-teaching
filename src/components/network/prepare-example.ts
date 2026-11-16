import { exampleImageProps, type ExampleSignal } from './examples';

const prepared: Partial<Record<ExampleSignal, Promise<void>>> = {};

/** Share native srcset selection and one bounded in-flight decode per public example. */
export function prepareExample(signal: ExampleSignal) {
  return (prepared[signal] ??= new Promise<void>((resolve, reject) => {
    const image = new Image();
    const props = exampleImageProps(signal);
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(deadline);
      image.onload = null;
      image.onerror = null;
      if (error) reject(error);
      else resolve();
    };
    const deadline = setTimeout(() => {
      image.removeAttribute('srcset');
      image.removeAttribute('src');
      finish(new Error('Example image timed out'));
    }, 8_000);
    image.onload = () => {
      void image.decode().then(
        () => finish(),
        () => finish(new Error('Example image unavailable')),
      );
    };
    image.onerror = () => finish(new Error('Example image unavailable'));
    image.sizes = props.sizes ?? '192px';
    image.srcset = props.srcSet ?? '';
    image.src = props.src;
  }).catch((error: unknown) => {
    delete prepared[signal];
    throw error;
  }));
}
