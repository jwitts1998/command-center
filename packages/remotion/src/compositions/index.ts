export { SocialClip, socialClipSchema } from './SocialClip';
export { ProductDemo, productDemoSchema } from './ProductDemo';
export { AdCreative, adCreativeSchema } from './AdCreative';

// Template registry for the VideoRenderer service
export const templateRegistry = {
  SocialClip: {
    id: 'SocialClip',
    name: 'Social Clip',
    description: 'Short-form content for Instagram Reels, TikTok, LinkedIn, X (15-60s)',
    defaultAspectRatio: '9:16' as const,
    supportedAspectRatios: ['9:16', '1:1', '16:9'] as const,
    defaultDurationSeconds: 30,
    category: 'social',
  },
  ProductDemo: {
    id: 'ProductDemo',
    name: 'Product Demo',
    description: 'Product walkthrough with feature highlights for YouTube and website (60-180s)',
    defaultAspectRatio: '16:9' as const,
    supportedAspectRatios: ['16:9'] as const,
    defaultDurationSeconds: 90,
    category: 'demo',
  },
  AdCreative: {
    id: 'AdCreative',
    name: 'Ad Creative',
    description: 'Paid ad formats for Meta, Google, YouTube, LinkedIn (15-30s)',
    defaultAspectRatio: '1:1' as const,
    supportedAspectRatios: ['1:1', '4:5', '9:16', '16:9'] as const,
    defaultDurationSeconds: 15,
    category: 'ads',
  },
} as const;

export type TemplateId = keyof typeof templateRegistry;
