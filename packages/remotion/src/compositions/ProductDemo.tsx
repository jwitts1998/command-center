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

export const productDemoSchema = z.object({
  appName: z.string(),
  tagline: z.string(),
  features: z.array(z.object({
    title: z.string(),
    description: z.string(),
    screenshotUrl: z.string(),
  })),
  brandColors: z.object({
    primary: z.string(),
    secondary: z.string(),
    text: z.string(),
  }),
  ctaText: z.string(),
  ctaUrl: z.string(),
  durationSeconds: z.number(),
});

type ProductDemoProps = z.infer<typeof productDemoSchema>;

export const ProductDemo: React.FC<ProductDemoProps> = ({
  appName,
  tagline,
  features,
  brandColors,
  ctaText,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Intro: first 3 seconds
  const introFrames = fps * 3;
  // Feature sections: equal time each
  const featureFrames = Math.floor((durationInFrames - introFrames - fps * 3) / Math.max(features.length, 1));
  // Outro: last 3 seconds
  const outroStart = durationInFrames - fps * 3;

  return (
    <AbsoluteFill style={{ backgroundColor: brandColors.secondary }}>
      {/* Intro sequence */}
      <Sequence from={0} durationInFrames={introFrames}>
        <IntroSlide
          appName={appName}
          tagline={tagline}
          brandColors={brandColors}
          fps={fps}
        />
      </Sequence>

      {/* Feature sequences */}
      {features.map((feature, i) => (
        <Sequence
          key={i}
          from={introFrames + i * featureFrames}
          durationInFrames={featureFrames}
        >
          <FeatureSlide
            feature={feature}
            brandColors={brandColors}
            index={i}
            fps={fps}
          />
        </Sequence>
      ))}

      {/* Outro CTA */}
      <Sequence from={outroStart} durationInFrames={fps * 3}>
        <OutroSlide
          appName={appName}
          ctaText={ctaText}
          brandColors={brandColors}
          fps={fps}
        />
      </Sequence>
    </AbsoluteFill>
  );
};

const IntroSlide: React.FC<{
  appName: string; tagline: string;
  brandColors: ProductDemoProps['brandColors']; fps: number;
}> = ({ appName, tagline, brandColors, fps }) => {
  const frame = useCurrentFrame();
  const titleEntry = spring({ frame, fps, config: { damping: 12 } });
  const tagEntry = spring({ frame: frame - 10, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(135deg, ${brandColors.secondary}, ${brandColors.primary})`,
      display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
    }}>
      <h1 style={{
        color: brandColors.text, fontSize: 96, fontWeight: 800, margin: 0,
        opacity: titleEntry, transform: `scale(${interpolate(titleEntry, [0, 1], [0.9, 1])})`,
      }}>
        {appName}
      </h1>
      <p style={{
        color: brandColors.text, fontSize: 36, opacity: tagEntry * 0.8, marginTop: 16,
      }}>
        {tagline}
      </p>
    </AbsoluteFill>
  );
};

const FeatureSlide: React.FC<{
  feature: ProductDemoProps['features'][0];
  brandColors: ProductDemoProps['brandColors'];
  index: number; fps: number;
}> = ({ feature, brandColors, fps }) => {
  const frame = useCurrentFrame();
  const entry = spring({ frame, fps, config: { damping: 14 } });
  const slideX = interpolate(entry, [0, 1], [80, 0]);

  return (
    <AbsoluteFill style={{
      backgroundColor: brandColors.secondary, display: 'flex',
      flexDirection: 'row', alignItems: 'center', padding: '0 80px', gap: 60,
    }}>
      {/* Text side */}
      <div style={{
        flex: 1, transform: `translateX(${slideX}px)`, opacity: entry,
      }}>
        <h2 style={{
          color: brandColors.primary, fontSize: 52, fontWeight: 700, margin: '0 0 20px 0',
        }}>
          {feature.title}
        </h2>
        <p style={{
          color: brandColors.text, fontSize: 28, lineHeight: 1.5, opacity: 0.85,
        }}>
          {feature.description}
        </p>
      </div>

      {/* Screenshot side */}
      {feature.screenshotUrl && (
        <div style={{
          flex: 1, display: 'flex', justifyContent: 'center',
          opacity: entry, transform: `scale(${interpolate(entry, [0, 1], [0.95, 1])})`,
        }}>
          <Img
            src={feature.screenshotUrl}
            style={{ maxWidth: '100%', maxHeight: 600, borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
          />
        </div>
      )}
    </AbsoluteFill>
  );
};

const OutroSlide: React.FC<{
  appName: string; ctaText: string;
  brandColors: ProductDemoProps['brandColors']; fps: number;
}> = ({ appName, ctaText, brandColors, fps }) => {
  const frame = useCurrentFrame();
  const entry = spring({ frame, fps, config: { damping: 10 } });

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(135deg, ${brandColors.primary}, ${brandColors.secondary})`,
      display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 40,
    }}>
      <h1 style={{
        color: brandColors.text, fontSize: 72, fontWeight: 800, margin: 0,
        opacity: entry,
      }}>
        {appName}
      </h1>
      <div style={{
        backgroundColor: brandColors.text, padding: '24px 64px', borderRadius: 20,
        transform: `scale(${interpolate(entry, [0, 1], [0.8, 1])})`,
      }}>
        <span style={{ color: brandColors.primary, fontSize: 36, fontWeight: 700 }}>
          {ctaText}
        </span>
      </div>
    </AbsoluteFill>
  );
};
