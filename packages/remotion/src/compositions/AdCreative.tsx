import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Img,
} from 'remotion';
import { z } from 'zod';

export const adCreativeSchema = z.object({
  headline: z.string(),
  body: z.string(),
  ctaText: z.string(),
  offerText: z.string(),
  productImageUrl: z.string(),
  brandColors: z.object({
    primary: z.string(),
    secondary: z.string(),
    text: z.string(),
  }),
  platform: z.enum(['meta', 'google', 'youtube', 'linkedin']),
  durationSeconds: z.number(),
});

type AdCreativeProps = z.infer<typeof adCreativeSchema>;

export const AdCreative: React.FC<AdCreativeProps> = ({
  headline,
  body,
  ctaText,
  offerText,
  productImageUrl,
  brandColors,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Phase 1: Hook (first 2s)
  const hookEnd = fps * 2;
  // Phase 2: Value prop (2s-10s)
  const valueEnd = fps * 10;
  // Phase 3: CTA (last 5s)
  const ctaStart = durationInFrames - fps * 5;

  const hookEntry = spring({ frame, fps, config: { damping: 10 } });

  return (
    <AbsoluteFill style={{ backgroundColor: brandColors.secondary }}>
      {/* Background gradient */}
      <AbsoluteFill style={{
        background: `radial-gradient(circle at 30% 40%, ${brandColors.primary}33 0%, transparent 60%)`,
      }} />

      {/* Hook phase — headline punches in */}
      <Sequence from={0} durationInFrames={hookEnd}>
        <AbsoluteFill style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 60,
        }}>
          <h1 style={{
            color: brandColors.text, fontSize: 56, fontWeight: 800,
            textAlign: 'center', lineHeight: 1.2, margin: 0,
            transform: `scale(${interpolate(hookEntry, [0, 1], [1.1, 1])})`,
            opacity: hookEntry,
          }}>
            {headline}
          </h1>
        </AbsoluteFill>
      </Sequence>

      {/* Value prop phase — body + image */}
      <Sequence from={hookEnd} durationInFrames={valueEnd - hookEnd}>
        <ValuePhase
          body={body}
          productImageUrl={productImageUrl}
          offerText={offerText}
          brandColors={brandColors}
          fps={fps}
        />
      </Sequence>

      {/* CTA phase */}
      <Sequence from={ctaStart} durationInFrames={durationInFrames - ctaStart}>
        <CTAPhase
          headline={headline}
          ctaText={ctaText}
          brandColors={brandColors}
          fps={fps}
        />
      </Sequence>
    </AbsoluteFill>
  );
};

const ValuePhase: React.FC<{
  body: string; productImageUrl: string; offerText: string;
  brandColors: AdCreativeProps['brandColors']; fps: number;
}> = ({ body, productImageUrl, offerText, brandColors, fps }) => {
  const frame = useCurrentFrame();
  const entry = spring({ frame, fps, config: { damping: 12 } });
  const slideUp = interpolate(entry, [0, 1], [40, 0]);

  return (
    <AbsoluteFill style={{
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      alignItems: 'center', padding: 60, gap: 32,
    }}>
      {productImageUrl && (
        <div style={{
          opacity: entry, transform: `translateY(${slideUp}px)`,
          borderRadius: 20, overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,0.3)',
        }}>
          <Img src={productImageUrl} style={{ width: 400, height: 400, objectFit: 'cover' }} />
        </div>
      )}

      <p style={{
        color: brandColors.text, fontSize: 32, textAlign: 'center',
        lineHeight: 1.4, margin: 0, opacity: entry * 0.9, maxWidth: '85%',
        transform: `translateY(${slideUp}px)`,
      }}>
        {body}
      </p>

      {offerText && (
        <div style={{
          backgroundColor: brandColors.primary, padding: '12px 32px',
          borderRadius: 12, opacity: entry,
          transform: `translateY(${slideUp}px)`,
        }}>
          <span style={{ color: brandColors.text, fontSize: 24, fontWeight: 700 }}>
            {offerText}
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
};

const CTAPhase: React.FC<{
  headline: string; ctaText: string;
  brandColors: AdCreativeProps['brandColors']; fps: number;
}> = ({ headline, ctaText, brandColors, fps }) => {
  const frame = useCurrentFrame();
  const entry = spring({ frame, fps, config: { damping: 8, mass: 0.8 } });
  const pulse = Math.sin(frame / 8) * 0.03 + 1;

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(135deg, ${brandColors.primary}, ${brandColors.secondary})`,
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      alignItems: 'center', gap: 40, padding: 60,
    }}>
      <h2 style={{
        color: brandColors.text, fontSize: 44, fontWeight: 700,
        textAlign: 'center', margin: 0, opacity: entry,
      }}>
        {headline}
      </h2>
      <div style={{
        backgroundColor: brandColors.text, padding: '20px 56px',
        borderRadius: 16, transform: `scale(${interpolate(entry, [0, 1], [0.7, 1]) * pulse})`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}>
        <span style={{ color: brandColors.primary, fontSize: 32, fontWeight: 800 }}>
          {ctaText}
        </span>
      </div>
    </AbsoluteFill>
  );
};
