export interface DesignResource {
  name: string;
  url: string;
  category: 'web' | 'mobile' | 'component' | 'motion' | 'tool';
  icon: string;
  description: string;
  bestFor: string;
  keyPatterns?: string[];
}

export const designResources: DesignResource[] = [
  // Web Design Galleries
  {
    name: 'godly.website',
    url: 'https://godly.website',
    category: 'web',
    icon: '🌐',
    description: 'Curated award-worthy web design gallery',
    bestFor: 'Overall quality bar, hero sections, scroll interactions, typographic ambition',
    keyPatterns: ['Full-bleed heroes', 'Oversized typography', 'Non-linear layouts', 'Cursor interactions'],
  },
  {
    name: 'dark.design',
    url: 'https://www.dark.design',
    category: 'web',
    icon: '🌐',
    description: 'Dark UI curation — web and product',
    bestFor: 'Dark mode UI patterns, color palettes for dark themes, glow effects, depth',
    keyPatterns: ['Dark surface hierarchy', 'Accent glow effects', 'High-contrast typography', 'Grain textures'],
  },
  {
    name: 'minimal.gallery',
    url: 'https://minimal.gallery',
    category: 'web',
    icon: '🌐',
    description: 'Minimal web design curation',
    bestFor: 'Whitespace usage, typographic restraint, single-concept layouts',
    keyPatterns: ['Generous whitespace', 'Single-weight color palettes', 'Typography-focused', 'Invisible navigation'],
  },
  {
    name: 'awwwards.com',
    url: 'https://www.awwwards.com',
    category: 'web',
    icon: '🌐',
    description: 'Web design awards — industry standard',
    bestFor: 'Cutting-edge interactions, WebGL, scroll storytelling, agency work',
    keyPatterns: ['Scroll-based animation', 'Page transitions', 'Creative loading states'],
  },
  {
    name: 'land-book.com',
    url: 'https://land-book.com',
    category: 'web',
    icon: '🌐',
    description: 'Landing page gallery',
    bestFor: 'SaaS landing pages, pricing pages, feature sections',
    keyPatterns: ['Feature section layouts', 'Social proof', 'Pricing tables', 'CTA hierarchy'],
  },
  {
    name: 'saaspo.com',
    url: 'https://saaspo.com',
    category: 'web',
    icon: '🌐',
    description: 'SaaS UI/landing page gallery',
    bestFor: 'Product UI screenshots, dashboard previews, onboarding flows',
    keyPatterns: ['Dashboard mockups', 'Feature comparisons', 'Testimonial sections'],
  },
  {
    name: 'siteinspire.com',
    url: 'https://www.siteinspire.com',
    category: 'web',
    icon: '🌐',
    description: 'Web design gallery — refined curation',
    bestFor: 'Portfolio sites, brand sites, editorial web design',
    keyPatterns: ['Typographic hierarchy', 'Elegant grids', 'Subtle interactions'],
  },

  // Mobile App Design Galleries
  {
    name: 'mobbin.com',
    url: 'https://mobbin.com',
    category: 'mobile',
    icon: '📱',
    description: 'Mobile UI pattern library — real app screenshots',
    bestFor: 'Understanding what specific screens should contain and how top apps solve UX problems',
    keyPatterns: ['Navigation conventions', 'List item design', 'Card layouts', 'Bottom sheets', 'Tab bars', 'Empty states'],
  },
  {
    name: 'scrnshts.club',
    url: 'https://scrnshts.club',
    category: 'mobile',
    icon: '📱',
    description: 'App store screenshot curation — hand-picked',
    bestFor: 'First impressions, app store presentation, overall visual identity',
    keyPatterns: ['Color-forward designs', 'Bold mobile typography', 'Illustration vs photography'],
  },
  {
    name: 'pageflows.com',
    url: 'https://pageflows.com',
    category: 'mobile',
    icon: '📱',
    description: 'Full user flow recordings — mobile and web',
    bestFor: 'Understanding complete flows, not just individual screens',
    keyPatterns: ['Step sequencing', 'Screen transitions', 'Help text placement'],
  },
  {
    name: 'appshots.design',
    url: 'https://appshots.design',
    category: 'mobile',
    icon: '📱',
    description: 'Mobile UI screenshot gallery',
    bestFor: 'Visual browsing of diverse mobile styles',
    keyPatterns: ['Category-specific conventions', 'Industry color palettes'],
  },
  {
    name: 'pttrns.com',
    url: 'https://pttrns.com',
    category: 'mobile',
    icon: '📱',
    description: 'Mobile UI patterns library',
    bestFor: 'Pattern-based browsing (navigation, forms, onboarding)',
    keyPatterns: ['Search patterns', 'Filter interfaces', 'Profile pages'],
  },
  {
    name: 'collectui.com',
    url: 'https://collectui.com',
    category: 'mobile',
    icon: '📱',
    description: 'Daily UI challenge aggregator — Dribbble-sourced',
    bestFor: 'Component-level inspiration (buttons, cards, nav bars)',
    keyPatterns: ['Creative component takes', 'Color application', 'Micro-interaction concepts'],
  },
  {
    name: 'ui-sources.com',
    url: 'https://www.ui-sources.com',
    category: 'mobile',
    icon: '📱',
    description: 'Mobile interaction recordings',
    bestFor: 'Micro-interactions, gesture patterns, animated transitions',
    keyPatterns: ['Transition timing', 'Gesture feedback', 'Skeleton loading'],
  },

  // Component & Design System References
  {
    name: 'ui.shadcn.com',
    url: 'https://ui.shadcn.com',
    category: 'component',
    icon: '🧩',
    description: 'Component library — React/Tailwind',
    bestFor: 'API design for components, accessibility patterns, composable architecture',
  },
  {
    name: 'radix-ui.com',
    url: 'https://www.radix-ui.com',
    category: 'component',
    icon: '🧩',
    description: 'Headless accessible component primitives',
    bestFor: 'Correct accessibility and interaction semantics for complex components',
  },
  {
    name: 'neobrutalism.dev',
    url: 'https://www.neobrutalism.dev',
    category: 'component',
    icon: '🧩',
    description: 'Neobrutalist component library',
    bestFor: 'High-contrast, bold component design that stands out',
  },
  {
    name: 'magicui.design',
    url: 'https://magicui.design',
    category: 'component',
    icon: '🧩',
    description: 'Animated component library',
    bestFor: 'Motion-forward components — animated buttons, shimmer effects, particle backgrounds',
  },
  {
    name: 'animata.design',
    url: 'https://animata.design',
    category: 'component',
    icon: '🧩',
    description: 'Copy-paste animated components',
    bestFor: 'Specific animation patterns — loaders, transitions, micro-interactions',
  },

  // Motion & Animation References
  {
    name: 'rive.app/community',
    url: 'https://rive.app/community',
    category: 'motion',
    icon: '🎬',
    description: 'Interactive animation community',
    bestFor: 'Complex state-based animations, game-quality UI motion, character animation',
  },
  {
    name: 'lottiefiles.com',
    url: 'https://lottiefiles.com',
    category: 'motion',
    icon: '🎬',
    description: 'Lottie animation library',
    bestFor: 'Lightweight JSON-based animations for empty states, loading, success/error feedback',
  },

  // Tools
  {
    name: 'shadergradient.co',
    url: 'https://shadergradient.co',
    category: 'tool',
    icon: '🎨',
    description: 'Animated mesh/shader gradients as backgrounds',
    bestFor: 'Distinctive backgrounds, hero atmospheres, visual texture without photography',
  },
  {
    name: 'mesher.io',
    url: 'https://csshero.org/mesher',
    category: 'tool',
    icon: '🎨',
    description: 'CSS mesh gradient generator — static, lightweight',
    bestFor: 'Pure CSS mesh gradients, no JS required',
  },
  {
    name: 'grainy-gradients.vercel.app',
    url: 'https://grainy-gradients.vercel.app',
    category: 'tool',
    icon: '🎨',
    description: 'Grainy gradient playground',
    bestFor: 'Adding grain/noise texture over gradients for depth',
  },
  {
    name: 'svgbackgrounds.com',
    url: 'https://www.svgbackgrounds.com',
    category: 'tool',
    icon: '🎨',
    description: 'SVG pattern backgrounds',
    bestFor: 'Geometric, organic, subtle SVG pattern backgrounds',
  },
  {
    name: 'fontpair.co',
    url: 'https://www.fontpair.co',
    category: 'tool',
    icon: '🔤',
    description: 'Font pairing suggestions',
    bestFor: 'Google Fonts pairing suggestions with visual previews',
  },
  {
    name: 'typ.io',
    url: 'https://typ.io',
    category: 'tool',
    icon: '🔤',
    description: 'Real-world font pairings',
    bestFor: 'Font pairings from live websites',
  },
];

export interface QuickReferenceItem {
  task: string;
  resource: string;
}

export const quickReferenceTable: QuickReferenceItem[] = [
  { task: 'What should this mobile screen contain?', resource: 'mobbin.com → search by screen type' },
  { task: 'What does great web design look like?', resource: 'godly.website or awwwards.com' },
  { task: 'How should a dark UI feel?', resource: 'dark.design' },
  { task: 'How do I design this minimal/clean?', resource: 'minimal.gallery' },
  { task: "What's the full onboarding flow for top apps?", resource: 'pageflows.com' },
  { task: 'What does a premium mobile app look like?', resource: 'scrnshts.club' },
  { task: 'How should this component behave/animate?', resource: 'ui-sources.com' },
  { task: 'What component API should I use?', resource: 'ui.shadcn.com' },
  { task: 'I need an animated empty state', resource: 'lottiefiles.com' },
  { task: 'I need a distinctive background', resource: 'shadergradient.co or mesher.io' },
  { task: 'I need font pairing ideas', resource: 'fontpair.co' },
  { task: 'I need an animated component', resource: 'magicui.design or animata.design' },
  { task: 'SaaS landing page patterns', resource: 'land-book.com or saaspo.com' },
];

export const categoryLabels: Record<DesignResource['category'], string> = {
  web: 'Web Galleries',
  mobile: 'Mobile Galleries',
  component: 'Components',
  motion: 'Motion',
  tool: 'Tools',
};
