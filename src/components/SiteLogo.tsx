import { getImageProps } from 'next/image';

/** Native image negotiation without a forbidden inline placeholder-color style. */
export default function SiteLogo({ size, className }: { size: number; className: string }) {
  const { props } = getImageProps({
    src: '/brain-192.webp',
    alt: '',
    width: size,
    height: size,
    sizes: `${size}px`,
    loading: 'eager',
    className,
  });
  const { style: placeholderStyle, ...imageProps } = props;
  void placeholderStyle;
  return <img {...imageProps} alt="" aria-hidden="true" />;
}
