import { ImageResponse } from 'next/og';

export const alt = 'ML Teaching – Bilderkennung im Browser lernen';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 90,
        background: '#18181b',
        color: '#fafafa',
      }}
    >
      <div style={{ fontSize: 34, color: '#fca5a5', marginBottom: 32 }}>
        Entdecke maschinelles Lernen
      </div>
      <div style={{ fontSize: 100, fontWeight: 700 }}>ML Teaching</div>
      <div style={{ fontSize: 38, marginTop: 32 }}>
        Dein eigenes Bilderkennungsmodell. Direkt im Browser.
      </div>
    </div>,
    size,
  );
}
