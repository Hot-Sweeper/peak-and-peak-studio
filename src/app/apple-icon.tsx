import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleTouchIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: '#000000',
          borderRadius: 40,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: 14,
          paddingBottom: 26,
        }}
      >
        <div style={{ width: 20, height: 62, background: '#FF2D55', borderRadius: 6 }} />
        <div style={{ width: 20, height: 100, background: '#FF2D55', borderRadius: 6 }} />
        <div style={{ width: 20, height: 80, background: '#FF2D55', borderRadius: 6 }} />
      </div>
    ),
    { ...size }
  );
}
