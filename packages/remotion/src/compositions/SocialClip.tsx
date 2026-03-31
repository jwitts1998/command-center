import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';
import { z } from 'zod';

export const socialClipSchema = z.object({
  headline: z.string(),
  body: z.string(),
  ctaText: z.string(),
  ctaUrl: z.string(),
  brandColors: z.object({
    primary: z.string(),
    secondary: z.string(),
    text: z.string(),
  }),
  logoUrl: z.string(),
  backgroundMedia: z.string(),
  captionLines: z.array(z.string()),
  durationSeconds: z.number(),
  aspectRatio: z.enum(['9:16', '1:1', '16:9']),
});

type SocialClipProps = z.infer<typeof socialClipSchema>;

export const SocialClip: React.FC<SocialClipProps> = ({
  headline,
  body,
  ctaText,
  brandColors,
  logoUrl,
  captionLines,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Animations
  const headlineEntry = spring({ frame, fps, config: { damping: 12 } });
  const bodyEntry = spring({ frame: frame - 15, fps, config: { damping: 12 } });
  const ctaEntry = spring({ frame: frame - 30, fps, config: { damping: 12 } });

  const headlineY = interpolate(headlineEntry, [0, 1], [60, 0]);
  const bodyY = interpolate(bodyEntry, [0, 1], [40, 0]);
  const ctaScale = interpolate(ctaEntry, [0, 1], [0.8, 1]);

  // Outro fade
  const outroOpacity = interpolate(
    frame,
    [durationInFrames - 30, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Caption display (cycle through lines)
  const captionIndex = captionLines.length > 0
    ? Math.floor((frame / fps) * (captionLines.length / (durationInFrames / fps))) % captionLines.length
    : -1;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: brandColors.secondary,
        opacity: outroOpacity,
      }}
    >
      {/* Background gradient */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(135deg, ${brandColors.secondary} 0%, ${brandColors.primary}33 50%, ${brandColors.secondary} 100%)`,
        }}
      />

      {/* Logo */}
      {logoUrl && (
        <Sequence from={0} durationInFrames={durationInFrames}>
          <div style={{
            position: 'absolute', top: 60, left: 60,
            opacity: headlineEntry,
          }}>
            <img src={logoUrl} alt="" style={{ height: 48, objectFit: 'contain' }} />
          </div>
        </Sequence>
      )}

      {/* Main content */}
      <div style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        alignItems: 'center', height: '100%', padding: '0 60px', gap: 32,
      }}>
        {/* Headline */}
        <Sequence from={0}>
          <h1 style={{
            color: brandColors.text, fontSize: 64, fontWeight: 800,
            textAlign: 'center', lineHeight: 1.1, margin: 0,
            transform: `translateY(${headlineY}px)`, opacity: headlineEntry,
          }}>
            {headline}
          </h1>
        </Sequence>

        {/* Body */}
        <Sequence from={15}>
          <p style={{
            color: brandColors.text, fontSize: 32, textAlign: 'center',
            lineHeight: 1.4, margin: 0, opacity: 0.85,
            transform: `translateY(${bodyY}px)`, maxWidth: '90%',
          }}>
            {body}
          </p>
        </Sequence>

        {/* CTA */}
        <Sequence from={30}>
          <div style={{
            backgroundColor: brandColors.primary, padding: '20px 48px',
            borderRadius: 16, transform: `scale(${ctaScale})`,
          }}>
            <span style={{
              color: brandColors.text, fontSize: 28, fontWeight: 700,
            }}>
              {ctaText}
            </span>
          </div>
        </Sequence>
      </div>

      {/* Captions */}
      {captionIndex >= 0 && (
        <div style={{
          position: 'absolute', bottom: 120, left: 40, right: 40,
          textAlign: 'center',
        }}>
          <span style={{
            color: brandColors.text, fontSize: 24, fontWeight: 600,
            backgroundColor: 'rgba(0,0,0,0.6)', padding: '8px 20px',
            borderRadius: 8,
          }}>
            {captionLines[captionIndex]}
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
};
