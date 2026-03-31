import { Composition } from 'remotion';
import { SocialClip, socialClipSchema } from './compositions/SocialClip';
import { ProductDemo, productDemoSchema } from './compositions/ProductDemo';
import { AdCreative, adCreativeSchema } from './compositions/AdCreative';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SocialClip"
        component={SocialClip}
        durationInFrames={900} // 30s at 30fps
        fps={30}
        width={1080}
        height={1920}
        schema={socialClipSchema}
        defaultProps={{
          headline: 'Your Headline Here',
          body: 'Supporting text that explains the value proposition.',
          ctaText: 'Learn More',
          ctaUrl: 'https://example.com',
          brandColors: { primary: '#6366f1', secondary: '#1e1b4b', text: '#ffffff' },
          logoUrl: '',
          backgroundMedia: '',
          captionLines: [],
          durationSeconds: 30,
          aspectRatio: '9:16' as const,
        }}
      />
      <Composition
        id="ProductDemo"
        component={ProductDemo}
        durationInFrames={2700} // 90s at 30fps
        fps={30}
        width={1920}
        height={1080}
        schema={productDemoSchema}
        defaultProps={{
          appName: 'Your App',
          tagline: 'The tagline goes here',
          features: [
            { title: 'Feature 1', description: 'Description of feature 1', screenshotUrl: '' },
            { title: 'Feature 2', description: 'Description of feature 2', screenshotUrl: '' },
            { title: 'Feature 3', description: 'Description of feature 3', screenshotUrl: '' },
          ],
          brandColors: { primary: '#6366f1', secondary: '#1e1b4b', text: '#ffffff' },
          ctaText: 'Get Started',
          ctaUrl: 'https://example.com',
          durationSeconds: 90,
        }}
      />
      <Composition
        id="AdCreative"
        component={AdCreative}
        durationInFrames={450} // 15s at 30fps
        fps={30}
        width={1080}
        height={1080}
        schema={adCreativeSchema}
        defaultProps={{
          headline: 'Your Ad Headline',
          body: 'Compelling ad copy that drives action.',
          ctaText: 'Sign Up Free',
          offerText: '',
          productImageUrl: '',
          brandColors: { primary: '#6366f1', secondary: '#1e1b4b', text: '#ffffff' },
          platform: 'meta' as const,
          durationSeconds: 15,
        }}
      />
    </>
  );
};
