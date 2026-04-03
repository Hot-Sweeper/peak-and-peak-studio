import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: '#000000',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: 3,
          paddingBottom: 4,
        }}
      >
        <div style={{ width: 4, height: 14, background: '#FF2D55', borderRadius: 2 }} />
        <div style={{ width: 4, height: 22, background: '#FF2D55', borderRadius: 2 }} />
        <div style={{ width: 4, height: 18, background: '#FF2D55', borderRadius: 2 }} />
      </div>
    ),
    { ...size }
  );
}
