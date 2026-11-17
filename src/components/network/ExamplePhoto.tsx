import { exampleImageProps, NETWORK_EXAMPLES, type ExampleSignal } from './examples';

/** Native responsive delivery without an initial inline style under the shared hash CSP. */
export default function ExamplePhoto({
  signal,
  decorative = false,
  className,
  sizes,
}: {
  signal: ExampleSignal;
  decorative?: boolean;
  className: string;
  sizes?: string;
}) {
  return (
    <img
      {...exampleImageProps(signal, sizes)}
      alt={decorative ? '' : NETWORK_EXAMPLES[signal].alt}
      className={className}
    />
  );
}
